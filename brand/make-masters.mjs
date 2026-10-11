import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('out', { recursive: true });

async function clean(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height;
  const label = new Int32Array(W * H);
  const sizes = [0];
  let next = 0;
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (label[s] || data[s * 4 + 3] <= 12) continue;
    next++;
    let count = 0;
    stack.push(s);
    label[s] = next;
    while (stack.length) {
      const p = stack.pop();
      count++;
      const x = p % W,
        y = (p / W) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (!label[q] && data[q * 4 + 3] > 12) {
          label[q] = next;
          stack.push(q);
        }
      }
    }
    sizes.push(count);
  }
  const big = Math.max(...sizes);
  let minx = W,
    miny = H,
    maxx = 0,
    maxy = 0;
  for (let i = 0; i < W * H; i++) {
    const keep = label[i] && sizes[label[i]] > big * 0.01;
    if (!keep) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const x = i % W,
      y = (i / W) | 0;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
  const w = maxx - minx + 1,
    h = maxy - miny + 1;
  console.log(file, 'componentes', next, 'maior', big, 'recorte', w + 'x' + h);
  return sharp(buf).extract({ left: minx, top: miny, width: w, height: h }).png().toBuffer();
}

const dark = await clean('recibo-escuro.png');
const white = await clean('recibo-branco.png');

await sharp(dark)
  .resize({ height: 256 })
  .png({ compressionLevel: 9 })
  .toFile('out/logo-on-light.png');
await sharp(white)
  .resize({ height: 256 })
  .png({ compressionLevel: 9 })
  .toFile('out/logo-on-dark.png');

const T = 1024;
const tileSvg = Buffer.from(
  `<svg width="${T}" height="${T}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e7f3"/></linearGradient></defs><rect width="${T}" height="${T}" fill="url(#g)"/></svg>`,
);
async function tile(scale) {
  const art = await sharp(dark)
    .resize({ height: Math.round(T * scale) })
    .png()
    .toBuffer();
  const { width: aw, height: ah } = await sharp(art).metadata();
  return sharp(tileSvg)
    .composite([{ input: art, left: Math.round((T - aw) / 2), top: Math.round((T - ah) / 2) }])
    .png()
    .toBuffer();
}
const anyTile = await tile(0.62);
const r = Math.round(T * 0.2237);
const roundMask = Buffer.from(
  `<svg width="${T}" height="${T}"><rect width="${T}" height="${T}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
);
await sharp(anyTile)
  .ensureAlpha()
  .composite([{ input: roundMask, blend: 'dest-in' }])
  .png()
  .toFile('out/logo-any.png');
await sharp(await tile(0.5))
  .png()
  .toFile('out/logo-maskable.png');
await sharp(anyTile).flatten({ background: '#ffffff' }).png().toFile('out/logo-apple.png');

const { data, info } = await sharp(dark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < info.width * info.height; i++) {
  data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 255;
}
const sil = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toBuffer();
const side = 256,
  inner = 2 * Math.round(side * 0.4);
const silSmall = await sharp(sil)
  .resize({
    width: inner,
    height: inner,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
await sharp({
  create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: silSmall, left: (side - inner) / 2, top: (side - inner) / 2 }])
  .png()
  .toFile('out/logo-badge.png');
console.log('ok');
