#!/usr/bin/env node
/**
 * O contrato OpenAPI é do backend (repo moneylog-backend). Aqui fica uma cópia em contracts/openapi.yaml,
 * que o lint, o `api:types` e o e2e leem. Este script a mantém igual à fonte.
 *
 *   npm run contract:sync     copia a fonte para contracts/openapi.yaml (depois: npm run api:types)
 *   npm run contract:check    falha (exit 1) se a cópia diverge da fonte; sem fonte disponível, avisa e passa
 *
 * Fonte: MONEYLOG_CONTRACT_SRC, ou ../backend/contracts/openapi.yaml (layout do repo principal moneylog).
 */
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
  console.warn(`contract: fonte não encontrada (${source}). Defina MONEYLOG_CONTRACT_SRC. Nada a comparar.`);
  process.exit(check ? 0 : 1);
}
if (check) {
  const same = existsSync(target) && readFileSync(target).equals(readFileSync(source));
  if (!same) {
    console.error('contract:check: contracts/openapi.yaml diverge do backend. Rode `npm run contract:sync && npm run api:types`.');
    process.exit(1);
  }
  console.log('contract:check: cópia igual à fonte do backend.');
} else {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`contract: ${source} -> contracts/openapi.yaml. Rode \`npm run api:types\` em seguida.`);
}
