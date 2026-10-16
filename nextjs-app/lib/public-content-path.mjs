// Only public, read-only catalogue endpoints may use the optional content source.
export function publicContentPath(value) {
  if (typeof value !== 'string' || !/^\/(?:areas(?:\/[a-zA-Z0-9_-]+)?|properties(?:\/[a-fA-F0-9]{24})?|societies\/[a-zA-Z0-9_-]+\/\d+)(?:\?[^#]*)?$/.test(value)) return null;
  const url = new URL(value, 'https://local.invalid'), query = new URLSearchParams();
  for (const key of ['area', 'propertyType']) {
    const item = url.searchParams.get(key);
    if (item && /^[a-zA-Z0-9_-]+$/.test(item)) query.set(key, item);
  }
  return url.pathname + (query.size ? `?${query}` : '');
}

export function publicContentUrl(path) {
  return `/api/public-content?path=${encodeURIComponent(path)}`;
}
