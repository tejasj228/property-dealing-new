import { v2 as cloudinary } from 'cloudinary';
import { deliveryUrl } from './image-formats.mjs';
import { uniquePublicId } from './upload-ids.mjs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const UPLOAD_FOLDER = 'pawan-buildhome';

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: UPLOAD_FOLDER, ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/** Signed parameters that let the browser upload straight to Cloudinary, past Vercel's request-size limit. */
export function signBrowserUpload(prefix) {
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = cloudinary.config();
  if (!cloudName || !apiKey || !apiSecret) return null;
  const params = { folder: UPLOAD_FOLDER, public_id: uniquePublicId(prefix), timestamp: Math.round(Date.now() / 1000) };
  return {
    cloudName, apiKey, ...params,
    signature: cloudinary.utils.api_sign_request(params, apiSecret),
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

/** The fields the admin stores for an uploaded image; formats browsers cannot show are delivered as JPEG. */
export function describeUpload(result, file) {
  return {
    filename: result.public_id,
    originalName: file?.name,
    imageUrl: deliveryUrl(result.secure_url, result.format),
    size: file?.size ?? result.bytes,
    cloudinaryData: { public_id: result.public_id, version: result.version, format: result.format },
  };
}

export { cloudinary, uniquePublicId };
