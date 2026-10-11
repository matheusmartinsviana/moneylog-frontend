#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const srcDir = join(root, 'src');
const TOKENS = 'src/styles/tokens.css';
const LITERAL_COLOR_ALLOWED = new Set([
  TOKENS,
  'src/index.html',
  'src/app/common/components/liquid-glass/liquid-glass-filter.ts',
]);

const COLOR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/;
const GRADIENT = /gradient\(/i;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(srcDir).filter(
  (file) => /\.(css|html|ts)$/.test(file) && !file.endsWith('.spec.ts'),
);
const problems = [];

for (const file of files) {
  const rel = relative(root, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/^\s*(\*|\/\/).*$/, '');
    if (!LITERAL_COLOR_ALLOWED.has(rel) && COLOR.test(code)) {
      problems.push(`${rel}:${index + 1} cor literal fora de tokens.css: ${line.trim()}`);
    }
    if (rel !== TOKENS && GRADIENT.test(code))
      problems.push(
        `${rel}:${index + 1} gradiente literal fora de tokens.css (use var(--gradient-*)): ${line.trim()}`,
      );
  });
}

const MOTION_ALLOWED = new Set([
  'src/app/common/components/progress-bar/progress-bar.component.ts:width',
]);
const FORBIDDEN_PROPS =
  /^(width|height|min-.*|max-.*|top|left|right|bottom|inset.*|margin.*|padding.*|all)$/;

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

for (const file of files) {
  const rel = relative(root, file).split(sep).join('/');
  if (rel === TOKENS) continue;
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, ' '),
  );
  for (const match of text.matchAll(/(?<![-\w])(transition|animation)\s*:\s*([^;{}]+);/g)) {
    const [, kind, value] = match;
    const line = text.slice(0, match.index).split('\n').length;
    for (const item of splitTopLevel(value)) {
      if (/^(none|inherit|initial|unset)$/.test(item)) continue;
      const property = item.split(/\s+/)[0];
      const infinite = /\binfinite\b/.test(item);
      const tokenized = /var\(--(duration|motion)-/.test(item) || /^none\b/.test(item);
      if (!tokenized && !infinite && !/^0s?\b|\s0(s|ms)\b/.test(item)) {
        problems.push(`${rel}:${line} ${kind} sem duração por token (--duration-*): ${item}`);
      }
      if (
        kind === 'transition' &&
        FORBIDDEN_PROPS.test(property) &&
        !MOTION_ALLOWED.has(`${rel}:${property}`)
      ) {
        problems.push(
          `${rel}:${line} transition anima \`${property}\` (só transform, opacity, box-shadow e cores): ${item}`,
        );
      }
    }
  }
}

const tokens = readFileSync(join(root, TOKENS), 'utf8');
const lightCanvas = /:root \{[^}]*?--color-canvas:\s*(#[0-9a-f]{6})/i
  .exec(tokens)?.[1]
  ?.toLowerCase();
const darkCanvas = /\[data-theme='dark'\] \{[^}]*?--color-canvas:\s*(#[0-9a-f]{6})/i
  .exec(tokens)?.[1]
  ?.toLowerCase();
const index = readFileSync(join(srcDir, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(srcDir, 'manifest.webmanifest'), 'utf8'));
const metaColor = (scheme) =>
  new RegExp(
    `<meta name="theme-color" content="(#[0-9a-fA-F]{6})" media="\\(prefers-color-scheme: ${scheme}\\)"`,
  )
    .exec(index)?.[1]
    ?.toLowerCase();
if (metaColor('light') !== lightCanvas)
  problems.push(`src/index.html theme-color claro difere de --color-canvas (${lightCanvas})`);
if (metaColor('dark') !== darkCanvas)
  problems.push(
    `src/index.html theme-color escuro difere de --color-canvas escuro (${darkCanvas})`,
  );
for (const field of ['background_color', 'theme_color']) {
  if (String(manifest[field]).toLowerCase() !== lightCanvas)
    problems.push(`src/manifest.webmanifest ${field} difere de --color-canvas (${lightCanvas})`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problema(s) de estilo encontrados.`);
  process.exit(1);
}
console.log(
  `check-styles: ${files.length} arquivos verificados, nenhuma cor nem gradiente literal fora de tokens.css.`,
);
