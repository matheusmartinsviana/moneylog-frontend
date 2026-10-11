#!/usr/bin/env node
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

function render(master, size) {
  const base64 = readFileSync(new URL(master, brand)).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><image width="${size}" height="${size}" href="data:image/png;base64,${base64}"/></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

for (const { master, file, size } of outputs) {
  writeFileSync(new URL(file, out), render(master, size));
  console.log(`${file} (${size}×${size})`);
}
