import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contract = resolve(root, 'contracts', 'openapi.yaml');
const committed = join(root, 'src', 'util', 'api', 'schema.gen.ts');
const dir = mkdtempSync(join(tmpdir(), 'moneylog-api-'));
const fresh = join(dir, 'schema.gen.ts');

try {
  const run = spawnSync(
    process.execPath,
    [resolve(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js'), contract, '-o', fresh],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  if (run.status !== 0) {
    console.error(run.stdout, run.stderr);
    console.error('api:check: não foi possível gerar os tipos a partir de contracts/openapi.yaml.');
    process.exit(1);
  }
  if (readFileSync(fresh, 'utf8') !== readFileSync(committed, 'utf8')) {
    console.error(
      'api:check: src/util/api/schema.gen.ts está desatualizado em relação a contracts/openapi.yaml.\n' +
        'Rode "npm run api:types" e inclua o arquivo gerado.',
    );
    process.exit(1);
  }
  console.log('api:check: schema.gen.ts está atualizado.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
