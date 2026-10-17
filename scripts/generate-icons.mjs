#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

import sharp from 'sharp';

const source = readFileSync(new URL('../brand/logo-source.png', import.meta.url));
const icons = new URL('../src/assets/icons/', import.meta.url);
const brand = new URL('../src/assets/brand/', import.meta.url);

const BACKGROUND = { r: 10, g: 37, b: 30 };
const PALE = { r: 196, g: 224, b: 206 };
const SAGE = { r: 100, g: 159, b: 130 };
const GLYPH = { x0: 410, x1: 843, y0: 253, y1: 932 };
const CENTER = { x: (GLYPH.x0 + GLYPH.x1) / 2, y: (GLYPH.y0 + GLYPH.y1) / 2 };
const GLYPH_HEIGHT = GLYPH.y1 - GLYPH.y0;
const CORNER_RADIUS = 0.22;
const ZOOM_SMALL = 0.74;
const ZOOM_APP = 0.6;
const ZOOM_MASKABLE = 0.62;

const squareAround = (side) => ({
  left: Math.round(CENTER.x - side / 2),
  top: Math.round(CENTER.y - side / 2),
  width: Math.round(side),
  height: Math.round(side),
});

const flatSource = () => sharp(source).removeAlpha();

async function glyphRgba() {
  const { data, info } = await flatSource().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  const bg = [BACKGROUND.r, BACKGROUND.g, BACKGROUND.b];
  const foregrounds = [PALE, SAGE].map((c) => {
    const v = [c.r - bg[0], c.g - bg[1], c.b - bg[2]];
    return { v, norm: v[0] ** 2 + v[1] ** 2 + v[2] ** 2 };
  });
  for (let i = 0; i < info.width * info.height; i++) {
    const delta = [data[i * 3] - bg[0], data[i * 3 + 1] - bg[1], data[i * 3 + 2] - bg[2]];
    let best = { alpha: 0, residual: Infinity, fg: foregrounds[0] };
    for (const fg of foregrounds) {
      const dot = delta[0] * fg.v[0] + delta[1] * fg.v[1] + delta[2] * fg.v[2];
      const alpha = Math.min(1, Math.max(0, dot / fg.norm));
      const residual = Math.hypot(
        delta[0] - alpha * fg.v[0],
        delta[1] - alpha * fg.v[1],
        delta[2] - alpha * fg.v[2],
      );
      if (residual < best.residual) best = { alpha, residual, fg };
    }
    const alpha = best.alpha < 0.06 ? 0 : best.alpha;
    for (let c = 0; c < 3; c++) {
      const color = alpha === 0 ? bg[c] : Math.round(bg[c] + (delta[c] / alpha) * 1);
      out[i * 4 + c] = Math.min(255, Math.max(0, color));
    }
    out[i * 4 + 3] = Math.round(alpha * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

function roundedMask(size) {
  const radius = size * CORNER_RADIUS;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
}

async function tile(zoom, size, rounded) {
  const side = GLYPH_HEIGHT / zoom;
  const raw = await flatSource()
    .extract(squareAround(side))
    .resize(size, size, { kernel: 'lanczos3' })
    .toBuffer();
  const pipeline = sharp(raw);
  if (!rounded) return pipeline;
  const shaped = await pipeline
    .ensureAlpha()
    .composite([{ input: roundedMask(size), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp(shaped);
}

async function badge(size) {
  const padding = 0.08;
  const side = Math.round(GLYPH_HEIGHT * (1 + padding * 2));
  const glyph = await (await glyphRgba()).toBuffer();
  const cropped = await sharp(glyph)
    .extract(squareAround(side))
    .resize(size, size, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 0; i < size * size; i++) {
    cropped[i * 4] = 255;
    cropped[i * 4 + 1] = 255;
    cropped[i * 4 + 2] = 255;
  }
  return sharp(cropped, { raw: { width: size, height: size, channels: 4 } });
}

async function glyphMark(size) {
  const side = Math.round(GLYPH_HEIGHT * 1.06);
  const glyph = await (await glyphRgba()).toBuffer();
  return sharp(glyph)
    .extract({ ...squareAround(side) })
    .resize(size, size, { kernel: 'lanczos3' });
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

async function write(dir, file, pipeline, format = 'png') {
  const options =
    format === 'webp'
      ? { quality: 92, alphaQuality: 100, effort: 6 }
      : { compressionLevel: 9, palette: false, effort: 10 };
  const data = await pipeline[format](options).toBuffer();
  writeFileSync(new URL(file, dir), data);
  console.log(`${file} (${data.length} bytes)`);
  return data;
}

const favicons = [];
for (const size of [16, 32, 48]) {
  const data = await write(icons, `icon-${size}.png`, await tile(ZOOM_SMALL, size, true));
  favicons.push({ size, data });
}
writeFileSync(new URL('favicon.ico', icons), ico(favicons));
console.log('favicon.ico (16, 32, 48)');

await write(icons, 'icon-192.png', await tile(ZOOM_APP, 192, true));
await write(icons, 'icon-512.png', await tile(ZOOM_APP, 512, true));
await write(icons, 'icon-maskable-192.png', await tile(ZOOM_MASKABLE, 192, false));
await write(icons, 'icon-maskable-512.png', await tile(ZOOM_MASKABLE, 512, false));
await write(icons, 'apple-touch-icon.png', await tile(ZOOM_MASKABLE, 180, false));
await write(icons, 'badge-96.png', await badge(96));
for (const size of [64, 128, 256])
  await write(brand, `logo-mark-${size}.webp`, await glyphMark(size), 'webp');
