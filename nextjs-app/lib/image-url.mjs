// Cloudinary handles responsive delivery; local images and document originals stay intact.
export function contentImageUrl(source, width = 1000) {
  if (!source || typeof source !== 'string') return source;
  try {
    const url = new URL(source);
    if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes('/image/upload/') || /\.(pdf|svg)$/i.test(url.pathname)) return source;
    const size = Math.max(100, Math.min(2400, Math.round(width)));
    url.pathname = url.pathname.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${size},c_limit/`);
    return url.toString();
  } catch { return source; }
}
