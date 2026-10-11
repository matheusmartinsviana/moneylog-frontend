#!/usr/bin/env node
/**
 * Gera os PNGs do PWA e das notificações a partir dos mestres da marca em `brand/` (arte do dono).
 * Rode `npm run icons` depois de trocar um mestre; os PNGs gerados em `src/assets/icons` são versionados.
 *
 * - `logo-any.png`      (cantos arredondados transparentes) -> icon-32/192/512, usados no navegador, no manifest e no app;
 * - `logo-maskable.png` (arte na zona segura, borda prolongada) -> icon-maskable-192/512 (o sistema aplica a máscara);
 * - `logo-apple.png`    (quadrado cheio, sem transparência)  -> apple-touch-icon 180 (o iOS arredonda);
 * - `logo-badge.png`    (silhueta branca)                    -> badge-96, o ícone monocromático da barra de status do
 *                                                               Android nas notificações push.
 * Como os mestres foram feitos a partir do PNG original: `brand/make-masters.mjs` (precisa de `npm i --no-save sharp`).
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { Resvg } from '@resvg/resvg-js';

const brand = new URL('../brand/', import.meta.url);
const out = new URL('../src/assets/icons/', import.meta.url);
const outputs = [
  { master: 'logo-any.png', file: 'icon-32.png', size: 32 },
  { master: 'logo-any.png', file: 'icon-192.png', size: 192 },
  { master: 'logo-any.png', file: 'icon-512.png', size: 512 },
  { master: 'logo-maskable.png', file: 'icon-maskable-192.png', size: 192 },
  { master: 'logo-maskable.png', file: 'icon-maskable-512.png', size: 512 },
  { master: 'logo-apple.png', file: 'apple-touch-icon.png', size: 180 },
  { master: 'logo-badge.png', file: 'badge-96.png', size: 96 },
];

/** O resvg só redimensiona SVG: o mestre PNG entra embutido num SVG do tamanho final. */
function render(master, size) {
  const base64 = readFileSync(new URL(master, brand)).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><image width="${size}" height="${size}" href="data:image/png;base64,${base64}"/></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

for (const { master, file, size } of outputs) {
  writeFileSync(new URL(file, out), render(master, size));
  console.log(`${file} (${size}×${size})`);
}
