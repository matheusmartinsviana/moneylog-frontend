#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKENS = 'src/styles/tokens.css';
const LITERAL_COLOR_ALLOWED = new Set([
  TOKENS,
  'src/index.html',
  'src/app/common/components/liquid-glass/liquid-glass-filter.ts',
]);

const BACKDROP_ALLOWED = new Set([
  'src/styles/utilities.css',
  'src/app/common/services/glass-support.ts',
]);

export const TEMPORARY_EXCEPTIONS = [];

const FIXED_OR_STICKY = /position\s*:\s*(fixed|sticky)/;
const ACTIVE_BLUR = /backdrop-filter\s*:(?!\s*none)/;
const GLASS_CLASSES = new Set([
  'glass',
  'glass--strong',
  'glass-lens',
  'glass-panel',
  'glass-panel--strong',
  'glass-panel--wallet',
]);

const COLOR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/;
const GRADIENT = /gradient\(/i;

function isTemporarilyExempt(rel) {
  return TEMPORARY_EXCEPTIONS.some((exception) => exception.file === rel);
}

function classesOf(selector) {
  return new Set([...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
}

export function cssBlocks(text) {
  const blocks = [];
  let start = 0;
  let startLine = 1;
  let open = -1;
  let openLine = 1;
  let newlines = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\n') newlines++;
    else if (char === '{') {
      if (open !== -1) {
        start = open + 1;
        startLine = openLine;
      }
      open = i;
      openLine = newlines + 1;
    } else if (char === '}') {
      if (open !== -1 && start < open) {
        const raw = text.slice(start, open);
        const leading = raw.slice(0, Math.max(0, raw.search(/\S/)));
        blocks.push({
          selector: raw.trim(),
          body: text.slice(open + 1, i),
          index: start,
          line: startLine + leading.split('\n').length - 1,
        });
      }
      start = i + 1;
      startLine = newlines + 1;
      open = -1;
    }
  }
  return blocks;
}

export function findFixedBlurProblems(rel, source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const found = [];
  const fixed = [];
  const blurred = [];
  for (const { selector, body, index, line } of cssBlocks(text)) {
    const classes = classesOf(selector);
    const isFixed = FIXED_OR_STICKY.test(body);
    const isBlur = ACTIVE_BLUR.test(body);
    if (isFixed && isBlur)
      found.push(`${rel}:${line} elemento fixo ou sticky não recebe blur (use .glass-panel--flat)`);
    else if (isFixed && [...classes].some((name) => GLASS_CLASSES.has(name)))
      found.push(
        `${rel}:${line} elemento fixo ou sticky não recebe vidro (use .glass-panel--flat)`,
      );
    if (isFixed) fixed.push({ classes, line, index });
    if (isBlur) blurred.push({ classes, line, index });
  }
  for (const f of fixed)
    for (const b of blurred) {
      if (b.index === f.index) continue;
      const shared = [...f.classes].filter((name) => b.classes.has(name));
      if (shared.length > 0)
        found.push(
          `${rel}:${b.line} blur em .${shared[0]}, que é fixo ou sticky na linha ${f.line} (use .glass-panel--flat)`,
        );
    }
  return [...new Set(found)];
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function checkStyles(root) {
  const srcDir = join(root, 'src');
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

  for (const file of files) {
    const rel = relative(root, file).split(sep).join('/');
    const text = readFileSync(file, 'utf8');
    if (isTemporarilyExempt(rel)) continue;
    if (!BACKDROP_ALLOWED.has(rel) && /backdrop-filter/.test(text))
      problems.push(
        `${rel} usa backdrop-filter fora dos utilitários de vidro (use .glass, .glass-panel ou .glass-panel--flat)`,
      );
    if (rel.endsWith('.css')) problems.push(...findFixedBlurProblems(rel, text));
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
    for (const match of text.matchAll(
      /(?<![-\w])(transition|animation)\s*:\s*([^\s;{}][^;{}]*);/g,
    )) {
      const [, kind, value] = match;
      const line = text.slice(0, match.index).split('\n').length;
      for (const item of splitTopLevel(value)) {
        if (/^(none|inherit|initial|unset)$/.test(item)) continue;
        const property = item.split(/\s+/)[0];
        const infinite = /\binfinite\b/.test(item);
        const tokenized = /var\(--(duration|motion)-/.test(item) || /^none\b/.test(item);
        if (!tokenized && !infinite && !/(?:^0s?\b)|(?:\s0(?:s|ms)\b)/.test(item)) {
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

  return { problems, fileCount: files.length };
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const { problems, fileCount } = checkStyles(root);
  for (const exception of TEMPORARY_EXCEPTIONS)
    console.log(
      `check-styles: exceção temporária em ${exception.file} (${exception.rule}); sai na ${exception.removeIn}.`,
    );
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} problema(s) de estilo encontrados.`);
    process.exit(1);
  }
  console.log(
    `check-styles: ${fileCount} arquivos verificados, nenhuma cor nem gradiente literal fora de tokens.css.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
