// Gera os mestres da marca a partir da arte do dono (1254x1254, quadrado arredondado branco sobre fundo branco).
// Recorta o interior do quadrado (sem a sombra externa) e produz: any (cantos arredondados transparentes),
// maskable (tela 1024 com a arte na zona segura), apple (quadrado cheio) e badge (silhueta branca).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'source.png';
const CX = 627,
  CY = 622,
  CROP = 800;
const left = CX - CROP / 2,
  top = CY - CROP / 2;
mkdirSync('out', { recursive: true });

const crop = sharp(SRC).extract({ left, top, width: CROP, height: CROP });
const cropBuf = await crop.png().toBuffer();

// 1) any: cantos arredondados (22,37% = proporção do iOS)
const r = Math.round(CROP * 0.2237);
const roundMask = Buffer.from(
  `<svg width="${CROP}" height="${CROP}"><rect width="${CROP}" height="${CROP}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
);
await sharp(cropBuf)
  .ensureAlpha()
  .composite([{ input: roundMask, blend: 'dest-in' }])
  .png()
  .toFile('out/logo-any.png');

// cor da superfície: média da borda do recorte
const { data, info } = await sharp(cropBuf).raw().toBuffer({ resolveWithObject: true });
let sum = [0, 0, 0],
  n = 0;
for (let i = 0; i < CROP; i++)
  for (const [x, y] of [
    [i, 2],
    [i, CROP - 3],
    [2, i],
    [CROP - 3, i],
  ]) {
    for (let c = 0; c < 3; c++) sum[c] += data[(y * CROP + x) * info.channels + c];
    n++;
  }
const bg = sum.map((s) => Math.round(s / n));
console.log('superfície', bg);

// 2) maskable: tela 1024; a arte (recorte de 800) fica no centro e a borda é prolongada ("copy"), sem emenda visível
const CANVAS = 1024,
  PAD = (CANVAS - CROP) / 2;
await sharp(cropBuf)
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, extendWith: 'copy' })
  .png()
  .toFile('out/logo-maskable.png');

// 3) apple: quadrado cheio, sem transparência (o iOS arredonda)
await sharp(cropBuf)
  .flatten({ background: { r: bg[0], g: bg[1], b: bg[2] } })
  .png()
  .toFile('out/logo-apple.png');

// 4) badge: silhueta branca (barra de status do Android, monocromática). Alfa = quão mais escuro que a superfície.
const out = Buffer.alloc(CROP * CROP * 4);
for (let i = 0; i < CROP * CROP; i++) {
  const lum =
    0.2126 * data[i * info.channels] +
    0.7152 * data[i * info.channels + 1] +
    0.0722 * data[i * info.channels + 2];
  const a = Math.max(0, Math.min(1, (214 - lum) / 40));
  out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255;
  out[i * 4 + 3] = Math.round(a * 255);
}
await sharp(out, { raw: { width: CROP, height: CROP, channels: 4 } })
  .png()
  .toFile('out/logo-badge.png');
console.log('ok');
