import { deliveryUrl, isSupportedImage } from '../utils/imageFormats';

const MB = 1024 * 1024;
// Cloudinary's free plan stores photos up to 10 MB. Anything near that is shrunk first.
export const STORAGE_LIMIT = 10 * MB;
export const SHRINK_ABOVE = 9 * MB;
export const MAX_SOURCE_BYTES = 60 * MB;
// The website's own upload route sits behind a 4.5 MB request limit; it is only a fallback.
const SERVER_ROUTE_LIMIT = 4 * MB;
const ATTEMPTS = 3;
const SIMULTANEOUS = 3;

export class UploadError extends Error {
  constructor(message, { retryable = false, status = 0 } = {}) { super(message); this.name = 'UploadError'; this.retryable = retryable; this.status = status; }
}

export const formatBytes = bytes => bytes >= MB ? `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
export const fileKey = file => `${file.name}|${file.size}|${file.lastModified}`;

// A small queue so a batch of photos never floods the connection, however many are chosen.
let running = 0;
const waiting = [];
async function slot() {
  if (running >= SIMULTANEOUS) await new Promise(resolve => waiting.push(resolve));
  running++;
}
function release() { running--; waiting.shift()?.(); }

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/** POSTs a form and reports upload progress. Resolves with { status, body } for any HTTP answer. */
export function postForm(url, form, { onProgress, timeout }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    request.timeout = timeout;
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(event.loaded, event.total); };
    request.onload = () => {
      let body = null;
      try { body = JSON.parse(request.responseText); } catch { /* not JSON, e.g. a gateway error page */ }
      resolve({ status: request.status, body });
    };
    request.onerror = () => reject(new UploadError('The connection dropped', { retryable: true }));
    request.ontimeout = () => reject(new UploadError('The upload took too long', { retryable: true }));
    request.onabort = () => reject(new UploadError('The upload was cancelled'));
    request.send(form);
  });
}

/**
 * Downscales a photo that is too large to store. Returns the original when the browser cannot
 * decode it, so the caller can still try it as it is.
 */
export async function shrinkImage(file, { maxBytes = SHRINK_ABOVE, maxEdge = 4096 } = {}) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { return file; }
  try {
    let scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    for (let round = 0; round < 3; round++, scale *= .75) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [.9, .82, .74]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= maxBytes) return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
      }
    }
    return file;
  } finally { bitmap.close?.(); }
}

function friendlyMessage(file, status, body) {
  const detail = body?.error?.message || body?.message || '';
  if (/file size too large|too large|maximum is/i.test(detail)) return `${file.name} is ${formatBytes(file.size)}, which is over the ${formatBytes(STORAGE_LIMIT)} storage limit. Save it as a smaller JPG and try again.`;
  if (/invalid image|unsupported|not a supported/i.test(detail)) return `${file.name} could not be read as an image. Try saving it as a JPG or PNG.`;
  if (status === 401 || status === 403) return 'Your session has expired. Sign in again and retry.';
  return detail || `Upload failed (${status || 'no response'})`;
}

// Turns whatever the signing request threw into an UploadError, marking temporary failures as retryable.
function signingFailure(error) {
  if (error instanceof UploadError) return error;
  const status = error.response?.status || 0;
  if (status === 401 || status === 403) return new UploadError(friendlyMessage({ name: '', size: 0 }, status, null), { status });
  return new UploadError(error.response?.data?.message || (status ? 'Could not prepare the upload' : 'Could not reach the server'), { status, retryable: status === 0 || status === 429 || [500, 502, 504].includes(status) });
}

async function withRetries(task) {
  let failure;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try { return await task(); }
    catch (error) {
      failure = error;
      if (!error.retryable || attempt === ATTEMPTS - 1) break;
      await pause(700 * 2 ** attempt);
    }
  }
  throw failure;
}

/**
 * Uploads one photo and resolves with { imageUrl, publicId, format, bytes }.
 *
 * - `sign(purpose)` asks the website for one-use credentials; the photo then goes straight to
 *   Cloudinary, so it is not held to the website's request-size limit and any image type works.
 * - `legacyUpload(file, onProgress)` is used only when signing is unavailable and the file is small.
 * - Retries reuse the same credentials and image id, so a retry can never add a second copy.
 */
export async function uploadImageFile(file, { sign, legacyUpload, purpose = 'property', onProgress, post = postForm } = {}) {
  if (!isSupportedImage(file)) throw new UploadError(`${file.name} is not a supported image type`);
  if (file.size > MAX_SOURCE_BYTES) throw new UploadError(`${file.name} is ${formatBytes(file.size)}. The largest photo accepted is ${formatBytes(MAX_SOURCE_BYTES)}.`);
  await slot();
  try {
    const prepared = file.size > SHRINK_ABOVE ? await shrinkImage(file) : file;
    if (prepared.size > STORAGE_LIMIT) throw new UploadError(friendlyMessage(prepared, 0, { message: 'File size too large' }));
    let credentials;
    try { credentials = await withRetries(async () => { try { return await sign(purpose); } catch (error) { throw signingFailure(error); } }); }
    catch (error) {
      if (legacyUpload && prepared.size <= SERVER_ROUTE_LIMIT && [404, 405, 503].includes(error.status)) {
        const stored = await legacyUpload(prepared, loaded => onProgress?.(loaded, prepared.size));
        return { imageUrl: stored.imageUrl, publicId: stored.filename, format: stored.cloudinaryData?.format, bytes: stored.size };
      }
      throw error;
    }
    const timeout = Math.max(60000, Math.ceil(prepared.size / 40000) * 1000);
    const result = await withRetries(async () => {
      const form = new FormData();
      form.append('file', prepared);
      const { apiKey, timestamp, signature, folder, public_id: publicId } = credentials;
      Object.entries({ api_key: apiKey, timestamp, signature, folder, public_id: publicId }).forEach(([name, value]) => form.append(name, value));
      const { status, body } = await post(credentials.uploadUrl, form, { timeout, onProgress });
      if (status >= 200 && status < 300 && body?.secure_url) return body;
      throw new UploadError(friendlyMessage(file, status, body), { retryable: status === 0 || status === 429 || status >= 500, status });
    });
    return { imageUrl: deliveryUrl(result.secure_url, result.format), publicId: result.public_id, format: result.format, bytes: result.bytes };
  } finally { release(); }
}

/**
 * Uploads a batch. Each photo reports as it finishes, so successes are kept even when one fails.
 * Choosing the same file twice uploads it once.
 */
export async function uploadImageFiles(files, { onItem, onProgress, ...options } = {}) {
  const seen = new Set();
  const unique = files.filter(file => { const key = fileKey(file); if (seen.has(key)) return false; seen.add(key); return true; });
  const sent = new Array(unique.length).fill(0), total = unique.reduce((sum, file) => sum + file.size, 0) || 1;
  const report = () => onProgress?.(Math.min(100, Math.round(sent.reduce((sum, bytes) => sum + bytes, 0) * 100 / total)));
  return Promise.all(unique.map(async (file, index) => {
    let outcome;
    try {
      const stored = await uploadImageFile(file, { ...options, onProgress: (loaded, size) => { sent[index] = Math.min(file.size, Math.round(file.size * loaded / (size || file.size))); report(); } });
      sent[index] = file.size; report();
      outcome = { file, status: 'done', ...stored };
    } catch (error) {
      sent[index] = file.size; report();
      outcome = { file, status: 'failed', error: error.message || 'Upload failed' };
    }
    onItem?.(outcome);
    return outcome;
  }));
}
