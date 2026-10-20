// Offline: box-filters a Radiance HDR to a smaller equirectangular size and writes it
// back run-length encoded. Usage: node scripts/resample-hdr.mjs in.hdr out.hdr 512
import fs from 'node:fs';
import { FloatType } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
const [input, output, size = '512'] = process.argv.slice(2);
const loader = new HDRLoader().setDataType(FloatType);
const source = loader.parse(fs.readFileSync(input).buffer);
const width = Number(size), height = width / 2, scale = source.width / width, pixels = new Float32Array(width * height * 3);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) {
  let sum = 0;
  for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) sum += source.data[((y * scale + sy) * source.width + x * scale + sx) * 4 + c];
  pixels[(y * width + x) * 3 + c] = sum / (scale * scale);
}
const rgbe = (r, g, b) => {
  const v = Math.max(r, g, b); if (v < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(v) + 1e-9), f = 256 / 2 ** e;
  return [Math.min(255, Math.floor(r * f)), Math.min(255, Math.floor(g * f)), Math.min(255, Math.floor(b * f)), e + 128];
};
const chunks = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`)];
for (let y = 0; y < height; y++) {
  const line = Array.from({ length: width }, (_, x) => rgbe(...pixels.subarray((y * width + x) * 3, (y * width + x) * 3 + 3)));
  const out = [2, 2, width >> 8, width & 255];
  for (let c = 0; c < 4; c++) {
    const values = line.map(p => p[c]);
    for (let i = 0; i < width;) {
      let run = 1; while (i + run < width && run < 127 && values[i + run] === values[i]) run++;
      if (run >= 3) { out.push(128 + run, values[i]); i += run; continue; }
      let literal = 0; while (i + literal < width && literal < 128) { let next = 1; while (i + literal + next < width && next < 3 && values[i + literal + next] === values[i + literal]) next++; if (next >= 3) break; literal++; }
      out.push(literal, ...values.slice(i, i + literal)); i += literal;
    }
  }
  chunks.push(Buffer.from(out));
}
fs.writeFileSync(output, Buffer.concat(chunks));
const check = loader.parse(fs.readFileSync(output).buffer);
console.log(output, fs.statSync(output).size, 'bytes', check.width, 'x', check.height);
