export function scenePixelRatio(width, height, { devicePixelRatio = 1, compact = false, lowPower = false, maxTextureSize = 8192 } = {}) {
  if (width <= 0 || height <= 0) return 1;
  const budget = lowPower || compact ? 700000 : 1400000;
  return Math.min(devicePixelRatio || 1, lowPower || compact ? 1 : 1.35, Math.sqrt(budget / (width * height)), maxTextureSize / Math.max(width, height));
}
export function prefersLightweightScene(device = {}) {
  return Boolean(device.connection?.saveData || (device.deviceMemory && device.deviceMemory <= 4) || (device.hardwareConcurrency && device.hardwareConcurrency <= 4));
}
