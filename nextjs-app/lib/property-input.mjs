export const PROPERTY_TYPES = ['residential', 'commercial'];

const count = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number >= 0 ? number : null;
};

/**
 * Cleans an admin property payload. An empty plot is land only, so it never carries bedrooms
 * or bathrooms, whatever the form sent. Returns { body } or { error }.
 */
export function normalizePropertyInput(input, { partial = false } = {}) {
  const body = { ...input };
  if (body.propertyType !== undefined && !PROPERTY_TYPES.includes(body.propertyType)) {
    return { error: 'Property type must be "residential" or "commercial"' };
  }
  if (!partial && !body.propertyType) body.propertyType = 'residential';
  if ('isPlot' in body || !partial) body.isPlot = body.isPlot === true || body.isPlot === 'true';
  if (body.isPlot) { body.beds = null; body.baths = null; }
  else {
    if ('beds' in body) body.beds = count(body.beds);
    if ('baths' in body) body.baths = count(body.baths);
  }
  return { body };
}
