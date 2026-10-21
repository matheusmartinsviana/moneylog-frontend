#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT_BYTES = 8 * 1024;
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, process.argv[2] ?? 'dist/moneylog/browser');

const fromRoot = relative(root, dist);
if (fromRoot === '' || fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
  console.error(`check-chart-budget: o diretório medido precisa ficar dentro de ${root}.`);
  process.exit(2);
}

let files;
try {
  files = readdirSync(dist).filter((name) => /\.js$/.test(name));
} catch {
  console.log(`check-chart-budget: sem build em ${dist}; nada a medir.`);
  process.exit(0);
}

const charts = files.filter((name) => {
  const text = readFileSync(join(dist, name), 'utf8');
  return text.includes('lc__plot') && text.includes('lc__svg');
});

if (charts.length === 0) {
  console.log('check-chart-budget: os gráficos não estão no build de produção (nada a medir).');
  process.exit(0);
}

let failures = 0;
for (const name of charts) {
  const text = readFileSync(join(dist, name));
  const gz = gzipSync(text).length;
  const isMain = /^main-/.test(name);
  const verdict = isMain
    ? `no bundle principal (orçamento \`initial\`): ${(gz / 1024).toFixed(1)} kB gzip no arquivo todo`
    : `${(gz / 1024).toFixed(1)} kB gzip (limite ${LIMIT_BYTES / 1024} kB)`;
  console.log(`check-chart-budget: ${name}: ${verdict}`);
  if (!isMain && gz > LIMIT_BYTES) {
    failures++;
    console.error(`  FALHA: o chunk dos gráficos passa de ${LIMIT_BYTES / 1024} kB gzip.`);
  }
}
process.exit(failures > 0 ? 1 : 0);
