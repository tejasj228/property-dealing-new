// Identity-based variation stays put across refreshes and property edits.
export function mapSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function mapRandom(seed, salt = 0) {
  let value = (seed + Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  value = Math.imul(value ^ value >>> 16, 0x21f0aaad); value = Math.imul(value ^ value >>> 15, 0x735a2d97);
  return ((value ^ value >>> 15) >>> 0) / 4294967296;
}
export function layoutProperties(properties) {
  let gx = 0, gz = 0, dx = 1, dz = 0, run = 1, passed = 0, turns = 0;
  const rows = properties.map((property, index) => {
    const seed = mapSeed(property.id), row = { id: property.id, type: property.propertyType, gx, gz, seed,
      x: gx * 6.6 + (mapRandom(seed, 0) - .5) * .7, z: gz * 6.2 + (mapRandom(seed, 1) - .5) * .65,
      rotation: (mapRandom(seed, 2) - .5) * .24, shape: seed % 5, scaleX: .85 + mapRandom(seed, 3) * .22, scaleZ: .85 + mapRandom(seed, 4) * .22, index };
    gx += dx; gz += dz; passed++;
    if (passed === run) { passed = 0; const previous = dx; dx = -dz; dz = previous; turns++; if (turns % 2 === 0) run++; }
    return row;
  });
  const minX = Math.min(0, ...rows.map(row => row.gx * 6.6)), maxX = Math.max(0, ...rows.map(row => row.gx * 6.6));
  const minZ = Math.min(0, ...rows.map(row => row.gz * 6.2)), maxZ = Math.max(0, ...rows.map(row => row.gz * 6.2));
  return rows.map(row => ({ ...row, x: row.x - (minX + maxX) / 2, z: row.z - (minZ + maxZ) / 2 }));
}
export function mapBounds(plots) {
  return { width: Math.max(17, ...plots.map(plot => Math.abs(plot.x) * 2 + 10)), depth: Math.max(13, ...plots.map(plot => Math.abs(plot.z) * 2 + 9)) };
}
