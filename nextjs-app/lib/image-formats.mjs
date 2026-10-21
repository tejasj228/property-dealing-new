// Upload types accepted from the admin, and how each is delivered to visitors.
export const IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'jpe', 'jfif', 'pjpeg', 'png', 'apng', 'gif', 'webp', 'avif', 'heic', 'heif', 'heics', 'heifs', 'hif',
  'bmp', 'dib', 'tif', 'tiff', 'svg', 'ico', 'jp2', 'j2k', 'jxl',
];

// File pickers list these. HEIC photos carry no MIME type on Windows, so extensions are named too.
export const IMAGE_ACCEPT = ['image/*', ...IMAGE_EXTENSIONS.map(extension => `.${extension}`)].join(',');

// Browsers other than Safari cannot show these, so Cloudinary converts them on delivery.
const CONVERTED = new Set(['heic', 'heif', 'heics', 'heifs', 'hif', 'tif', 'tiff', 'jp2', 'j2k', 'jxl', 'psd']);

export function extensionOf(name = '') {
  const match = /\.([a-z0-9]+)$/i.exec(String(name).split(/[?#]/)[0]);
  return match ? match[1].toLowerCase() : '';
}

export function isSupportedImage(file) {
  if (!file) return false;
  if (String(file.type || '').startsWith('image/')) return true;
  return IMAGE_EXTENSIONS.includes(extensionOf(file.name));
}

/** `.../photo.heic` becomes `.../photo.jpg`; Cloudinary derives the JPEG on first request. */
export function deliveryUrl(url, format) {
  if (!url || typeof url !== 'string') return url;
  const extension = (format || extensionOf(url)).toLowerCase();
  if (!CONVERTED.has(extension)) return url;
  return url.replace(new RegExp(`\\.${extension}(?=$|[?#])`, 'i'), '.jpg');
}
