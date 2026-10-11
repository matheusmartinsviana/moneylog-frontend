#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'contracts', 'openapi.yaml');
const source = process.env.MONEYLOG_CONTRACT_SRC
  ? resolve(process.env.MONEYLOG_CONTRACT_SRC)
  : resolve(root, '..', 'backend', 'contracts', 'openapi.yaml');
const check = process.argv.includes('--check');

if (!existsSync(source)) {
  console.warn(
    `contract: fonte não encontrada (${source}). Defina MONEYLOG_CONTRACT_SRC. Nada a comparar.`,
  );
  process.exit(check ? 0 : 1);
}
if (check) {
  const same = existsSync(target) && readFileSync(target).equals(readFileSync(source));
  if (!same) {
    console.error(
      'contract:check: contracts/openapi.yaml diverge do backend. Rode `npm run contract:sync && npm run api:types`.',
    );
    process.exit(1);
  }
  console.log('contract:check: cópia igual à fonte do backend.');
} else {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(
    `contract: ${source} -> contracts/openapi.yaml. Rode \`npm run api:types\` em seguida.`,
  );
}
