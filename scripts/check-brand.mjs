#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const brand = /BRAND_NAME\s*=\s*'([^']+)'/.exec(
  readFileSync(join(src, 'app/config/brand.ts'), 'utf8'),
)?.[1];
const problems = [];
if (!brand) {
  console.error('check-brand: BRAND_NAME não encontrado em src/app/config/brand.ts');
  process.exit(1);
}

const html = readFileSync(join(src, 'index.html'), 'utf8');
if (!existsSync(join(src, 'assets/icons/favicon.ico')))
  problems.push('src/assets/icons/favicon.ico não existe (rode npm run icons)');
for (const needle of [
  `<title>${brand}</title>`,
  `<meta name="application-name" content="${brand}" />`,
  `<meta name="apple-mobile-web-app-title" content="${brand}" />`,
]) {
  if (!html.includes(needle)) problems.push(`src/index.html não contém ${needle}`);
}
const manifest = JSON.parse(readFileSync(join(src, 'manifest.webmanifest'), 'utf8'));
for (const field of ['name', 'short_name']) {
  if (manifest[field] !== brand)
    problems.push(`src/manifest.webmanifest ${field} (${manifest[field]}) difere de BRAND_NAME`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const literal = new RegExp(`(['"\`])${brand}\\1|>\\s*${brand}\\s*<`, 'i');
const ident = '(?![.:_-]\\w)';
const word = new RegExp(`\\b${brand}\\b${ident}`, 'i');
const RESERVED_KEY = new RegExp(
  `(chave|key|clave)\\s+${brand}\\b|\\b${brand}\\s+key\\b|${brand}\\s+das propriedades|${brand}\\s+in the properties`,
  'i',
);
const quoted = new RegExp(`(['"\`])(?:(?!\\1).)*\\b${brand}\\b${ident}(?:(?!\\1).)*\\1`, 'i');
const comment = /^\s*(\/\/|\*|\/\*|<!--)/;
for (const file of walk(join(src, 'app'))) {
  const rel = relative(root, file).split(sep).join('/');
  if (!/\.(ts|html)$/.test(file) || file.endsWith('.spec.ts') || rel.endsWith('config/brand.ts'))
    continue;
  const translation = /\/i18n\/translations\/[^/]+\.ts$/.test(rel);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (comment.test(line)) return;
      const bare = literal.test(line);
      const inSentence = translation ? word.test(line) : quoted.test(line);
      if ((bare || inSentence) && !RESERVED_KEY.test(line))
        problems.push(`${rel}:${index + 1} marca escrita à mão: ${line.trim()}`);
    });
}

for (const file of [
  'src/app/common/components/app-shell/sidebar/sidebar.component.html',
  'src/app/features/login/pages/login.page.html',
]) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const logo of ['logo-mark-128'])
    if (!text.includes(`assets/brand/${logo}.webp`))
      problems.push(`${file}: falta o logo (assets/brand/${logo}.webp)`);
}
for (const file of [
  'brand/logo-source.png',
  'src/assets/brand/logo-mark-64.webp',
  'src/assets/brand/logo-mark-128.webp',
  'src/assets/brand/logo-mark-256.webp',
])
  if (!existsSync(join(root, file))) problems.push(`${file} não existe (rode npm run icons)`);
for (const old of ['logo-on-light', 'logo-on-dark'])
  if (existsSync(join(src, 'assets/brand', `${old}.png`)))
    problems.push(`src/assets/brand/${old}.png é a marca antiga e deve ser removido`);
for (const icon of [
  'icon-16',
  'icon-32',
  'icon-48',
  'icon-192',
  'icon-512',
  'icon-maskable-192',
  'icon-maskable-512',
  'apple-touch-icon',
  'badge-96',
]) {
  if (!existsSync(join(src, 'assets/icons', `${icon}.png`)))
    problems.push(`src/assets/icons/${icon}.png não existe (rode npm run icons)`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problema(s) de marca.`);
  process.exit(1);
}
console.log(`check-brand: marca "${brand}" em um só lugar; logo e ícones presentes.`);
