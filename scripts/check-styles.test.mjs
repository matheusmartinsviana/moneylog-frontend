import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { TEMPORARY_EXCEPTIONS, checkStyles, findFixedBlurProblems } from './check-styles.mjs';

const BOTTOM_NAV = 'src/app/common/components/app-shell/bottom-nav/bottom-nav.component.css';
const script = fileURLToPath(new URL('./check-styles.mjs', import.meta.url));
const utilities = readFileSync(new URL('../src/styles/utilities.css', import.meta.url), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'check-styles-'));
after(() => rmSync(dir, { recursive: true, force: true }));

let counter = 0;
function project(files = {}) {
  const root = join(dir, `p${counter++}`);
  const base = {
    'src/styles/tokens.css':
      ":root {\n  --color-canvas: #f1f2ea;\n}\n[data-theme='dark'] {\n  --color-canvas: #0b1d15;\n}\n",
    'src/index.html':
      '<meta name="theme-color" content="#f1f2ea" media="(prefers-color-scheme: light)">\n' +
      '<meta name="theme-color" content="#0b1d15" media="(prefers-color-scheme: dark)">\n',
    'src/manifest.webmanifest': '{"background_color":"#f1f2ea","theme_color":"#f1f2ea"}',
    ...files,
  };
  for (const [path, content] of Object.entries(base)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const problemsOf = (files) => checkStyles(project(files)).problems;

test('projeto sem violações passa', () => {
  assert.deepEqual(problemsOf({}), []);
});

test('o repositório real passa pelo CLI', () => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('cor literal fora de tokens.css falha', () => {
  const problems = problemsOf({ 'src/app/x.css': '.a { color: #fff; }\n' });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cor literal/);
});

test('gradiente literal fora de tokens.css falha', () => {
  const problems = problemsOf({
    'src/app/x.css': '.a { background: linear-gradient(red, blue); }\n',
  });
  assert.ok(problems.some((p) => /gradiente literal/.test(p)));
});

test('backdrop-filter em css fora da allowlist falha', () => {
  const problems = problemsOf({ 'src/app/x.css': '.a { backdrop-filter: blur(4px); }\n' });
  assert.ok(problems.some((p) => /backdrop-filter fora dos utilitários/.test(p)));
});

test('transition com duração literal ou propriedade de layout falha', () => {
  const problems = problemsOf({
    'src/app/x.css': '.a { transition: width 200ms ease; }\n',
  });
  assert.ok(problems.some((p) => /sem duração por token/.test(p)));
  assert.ok(problems.some((p) => /anima `width`/.test(p)));
});

test('theme-color divergente do canvas falha', () => {
  const problems = problemsOf({
    'src/manifest.webmanifest': '{"background_color":"#000000","theme_color":"#f1f2ea"}',
  });
  assert.ok(problems.some((p) => /background_color/.test(p)));
});

test('fixed e blur na mesma regra falha, inclusive multilinha e dentro de @media', () => {
  const css = `@media (width <= 767px) {
  .glass-panel.x {
    position: fixed;
    inset: 0;
    backdrop-filter: blur(12px);
  }
}`;
  assert.equal(findFixedBlurProblems('x.css', css).length, 1);
});

test('fixed e blur em regras separadas com a mesma classe falha', () => {
  const css = '.bar { position: fixed; }\n.bar.glass-panel { backdrop-filter: blur(8px); }\n';
  const problems = findFixedBlurProblems('x.css', css);
  assert.ok(
    problems.some((p) => /blur em \.bar/.test(p)),
    problems.join('\n'),
  );
});

test('sticky com blur fora de .glass-panel falha', () => {
  const css = '.bar { position: sticky; top: 0; backdrop-filter: blur(8px); }\n';
  assert.equal(findFixedBlurProblems('src/styles/utilities.css', css).length, 1);
});

test('elemento fixo com classe de vidro falha mesmo com o blur em outro arquivo', () => {
  const css = '.glass-panel { position: sticky; top: 0; }\n';
  assert.equal(findFixedBlurProblems('x.css', css).length, 1);
});

test('fixed sem blur e blur sem fixed em classes diferentes passam', () => {
  const css =
    '.bar { position: fixed; }\n.card { backdrop-filter: blur(8px); }\n.flat { backdrop-filter: none; position: fixed; }\n';
  assert.deepEqual(findFixedBlurProblems('x.css', css), []);
});

test('comentário não esconde nem cria violação', () => {
  const css = '/* .bar { position: fixed; backdrop-filter: blur(4px); } */\n.ok { color: red; }\n';
  assert.deepEqual(findFixedBlurProblems('x.css', css), []);
});

test('não há exceções temporárias e a barra inferior com blur fixo é reprovada', () => {
  assert.deepEqual(TEMPORARY_EXCEPTIONS, []);
  const css = '.bottom-nav { position: fixed; backdrop-filter: blur(16px); }\n';
  assert.ok(problemsOf({ [BOTTOM_NAV]: css }).length > 0);
});

test('o utilities.css real não tem blur em elemento fixo ou sticky', () => {
  assert.deepEqual(findFixedBlurProblems('src/styles/utilities.css', utilities), []);
});

function blocksOf(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));
}

test('css do vidro do painel: o blur só existe com data-glass-panel', () => {
  const blurs = blocksOf(utilities).filter(
    (b) => /glass-panel/.test(b.selector) && /backdrop-filter\s*:(?!\s*none)/.test(b.body),
  );
  assert.ok(blurs.length >= 2);
  for (const b of blurs) assert.match(b.selector, /html\[data-glass-panel\]/);
});

test('css do vidro do painel: sem o atributo o painel é sólido', () => {
  const base = blocksOf(utilities).filter((b) => /^\.glass-panel(--\w+)?$/.test(b.selector));
  assert.ok(base.length > 0);
  for (const b of base) assert.doesNotMatch(b.body, /backdrop-filter\s*:(?!\s*none)/);
});

test('css do vidro do painel: @supports not usa fundo sólido', () => {
  const start = utilities.indexOf(
    '@supports not (backdrop-filter: blur(1px)) {\n  html[data-glass-panel]',
  );
  assert.ok(start >= 0);
  const block = utilities.slice(start, utilities.indexOf('\n}\n', start));
  assert.match(block, /\.glass-panel \{[^}]*var\(--glass-panel-solid\)/);
  assert.match(block, /\.glass-panel--strong \{[^}]*var\(--glass-panel-solid-strong\)/);
});

test('css do vidro do painel: prefers-reduced-transparency zera o blur e usa sólido', () => {
  const start = utilities.indexOf(
    '@media (prefers-reduced-transparency: reduce) {\n  html[data-glass-panel]',
  );
  assert.ok(start >= 0);
  const block = utilities.slice(start, utilities.indexOf('\n}\n', start));
  assert.match(
    block,
    /\.glass-panel,\s*html\[data-glass-panel\] \.glass-panel--flat \{[^}]*var\(--glass-panel-solid\)[^}]*backdrop-filter: none/,
  );
  assert.match(block, /\.glass-panel--strong \{[^}]*var\(--glass-panel-solid-strong\)/);
});

test('css do vidro do painel: --flat nunca desfoca', () => {
  for (const b of blocksOf(utilities).filter((b) => /glass-panel--flat/.test(b.selector)))
    assert.doesNotMatch(b.body, /backdrop-filter\s*:(?!\s*none)/);
});
