import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-contrast.mjs', import.meta.url));
const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'check-contrast-'));
after(() => rmSync(dir, { recursive: true, force: true }));

function run(css, name) {
  const file = join(dir, `${name}.css`);
  writeFileSync(file, css);
  const result = spawnSync(process.execPath, [script, '--quiet', `--tokens=${file}`], {
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function mutate(css, pattern, replacement) {
  const mutated = css.replace(pattern, replacement);
  assert.notEqual(mutated, css, `a mutação ${pattern} não alterou nada`);
  return mutated;
}

test('os tokens atuais passam', () => {
  const { status, output } = run(tokens, 'baseline');
  assert.equal(status, 0, output);
});

test('falha quando o texto de despesa escuro perde contraste', () => {
  const css = mutate(tokens, /--color-expense-text: #f6b8b3/g, '--color-expense-text: #3a1016');
  const { status, output } = run(css, 'expense-text');
  assert.equal(status, 1);
  assert.match(output, /abaixo do mínimo/);
});

test('falha quando o token dos raios do início some', () => {
  const css = mutate(tokens, /--color-home-rays:[^;]+;/g, '');
  const { status, output } = run(css, 'rays');
  assert.equal(status, 1);
  assert.match(output, /Token ausente.*home-rays/);
});

test('falha quando o alfa do painel escuro sobe e clareia o fundo', () => {
  const css = mutate(tokens, /--home-glass-alpha: 7%/g, '--home-glass-alpha: 60%');
  const { status, output } = run(css, 'alpha');
  assert.equal(status, 1);
  assert.match(output, /abaixo do mínimo/);
});

test('falha quando a marca do emissor tem o tom do fundo do cartão', () => {
  const css = mutate(
    tokens,
    /--card-issuer-itau-mark: #0b2a6b/g,
    '--card-issuer-itau-mark: #ff5a00',
  );
  const { status, output } = run(css, 'issuer');
  assert.equal(status, 1);
  assert.match(output, /abaixo do mínimo/);
});

test('falha quando a marca de despesa some do painel forte escuro', () => {
  const css = mutate(tokens, /--color-expense-mark: #ee8c88/g, '--color-expense-mark: #3a1016');
  const { status } = run(css, 'mark');
  assert.equal(status, 1);
});
