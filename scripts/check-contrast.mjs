#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const tokensArg = process.argv.find((arg) => arg.startsWith('--tokens='));
const css = readFileSync(
  tokensArg
    ? tokensArg.slice('--tokens='.length)
    : new URL('../src/styles/tokens.css', import.meta.url),
  'utf8',
);
const MIN = 4.5;
const FOREGROUNDS = ['text', 'text-muted', 'accent', 'positive', 'warning', 'risk'];
const BACKGROUNDS = ['canvas', 'surface', 'surface-muted', 'surface-inset'];
const MIN_GRAPHIC = 3;
const SOFT_PAIRS = [
  ['accent', 'accent-soft'],
  ['positive', 'positive-soft'],
  ['warning', 'warning-soft'],
  ['risk', 'risk-soft'],
  ['text', 'accent-soft'],
  ['accent', 'accent-soft-hover'],
];
const GRAPHIC_PAIRS = [
  ['chart-1', 'surface'],
  ['chart-2', 'surface'],
  ['chart-1', 'surface-muted'],
  ['chart-2', 'surface-muted'],
  ['control-border', 'surface'],
  ['control-border', 'surface-muted'],
  ['control-border', 'canvas'],
  ['control-border', 'surface-inset'],
  ['chart-1', 'surface-inset'],
  ['chart-2', 'surface-inset'],
  ['focus', 'surface'],
  ['focus', 'surface-muted'],
];

function colors(block) {
  const map = {};
  for (const [, name, value] of block.matchAll(
    /--((?:color-|card-issuer-)[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g,
  ))
    map[name.startsWith('color-') ? name.slice(6) : name] = value;
  return map;
}

const lightBlock = css.slice(
  css.indexOf(':root {'),
  css.indexOf('@media (prefers-color-scheme: dark)'),
);
const darkBlock = css.slice(css.indexOf(":root[data-theme='dark']"));
const mediaBlock = css.slice(
  css.indexOf('@media (prefers-color-scheme: dark)'),
  css.indexOf(":root[data-theme='dark']"),
);
const themes = { claro: colors(lightBlock), escuro: colors(darkBlock) };

if (JSON.stringify(colors(mediaBlock)) !== JSON.stringify(themes.escuro)) {
  console.error(
    "Os tokens de @media (prefers-color-scheme: dark) e de [data-theme='dark'] divergem.",
  );
  process.exit(1);
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const blocks = { claro: lightBlock, escuro: darkBlock };

const HOME_TEXTS = ['home-text', 'home-text-muted', 'income-text', 'expense-text', 'neutral-text'];
const HOME_MARKS = ['income-mark', 'expense-mark', 'neutral-mark', 'home-focus'];
const ISSUERS = ['neutral', 'itau', 'nubank', 'bb', 'mercadopago'];

function percent(block, name) {
  const m = block.match(new RegExp(`--${name}:\\s*(\\d+(?:\\.\\d+)?)%\\s*;`));
  if (!m) {
    console.error(`Token --${name} ausente.`);
    process.exit(1);
  }
  return Number(m[1]) / 100;
}

const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function mixHex(top, base, alpha) {
  const t = [1, 3, 5].map((i) => parseInt(top.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));
  return hex(...t.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

function homeSurfaces(theme, map, block) {
  const need = ['home-bg', 'home-bg-lift', 'home-bg-deep', 'home-glass-tint', 'home-rays'];
  for (const name of need) {
    if (!map[name]) {
      console.error(`Token ausente no tema ${theme}: ${name}`);
      process.exit(1);
    }
  }
  const alpha = percent(block, 'home-glass-alpha');
  const alphaStrong = percent(block, 'home-glass-alpha-strong');
  const raysMax = percent(block, 'rays-opacity-max');
  const points = {
    fundo: map['home-bg'],
    'fundo claro': map['home-bg-lift'],
    'fundo escuro': map['home-bg-deep'],
  };
  const surfaces = [];
  for (const [label, base] of Object.entries(points)) {
    surfaces.push({ label, color: base, panel: false });
    surfaces.push({
      label: `painel ${label}`,
      color: mixHex(map['home-glass-tint'], base, alpha),
      panel: true,
    });
    surfaces.push({
      label: `painel forte ${label}`,
      color: mixHex(map['home-glass-tint'], base, alphaStrong),
      panel: true,
      strong: true,
    });
  }
  surfaces.push({
    label: 'solido',
    color: mixHex(map['home-glass-tint'], map['home-bg'], alpha),
    panel: true,
  });
  surfaces.push({
    label: 'solido forte',
    color: mixHex(map['home-glass-tint'], map['home-bg'], alphaStrong),
    panel: true,
    strong: true,
  });
  if (raysMax > 0) {
    const lit = mixHex(map['home-rays'], map['home-bg-lift'], raysMax);
    surfaces.push({ label: 'raios no maximo', color: lit, panel: false });
    surfaces.push({
      label: 'raios no maximo sob painel minimo',
      color: mixHex(map['home-glass-tint'], lit, alpha),
      panel: true,
    });
  }
  return surfaces;
}
function hoverOver(block, bgHex) {
  const m = block.match(/--color-hover-soft:\s*rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)/);
  if (!m) {
    console.error('Token --color-hover-soft ausente.');
    process.exit(1);
  }
  const a = Number(m[4]) / 100;
  const over = [Number(m[1]), Number(m[2]), Number(m[3])];
  const base = [1, 3, 5].map((i) => parseInt(bgHex.slice(i, i + 2), 16));
  return hex(...over.map((c, i) => c * a + base[i] * (1 - a)));
}

const rows = ['| Tema | Texto | Fundo | Contraste | AA (4,5:1) |', '|---|---|---|---|---|'];
let failures = 0;
for (const [theme, map] of Object.entries(themes)) {
  for (const fg of FOREGROUNDS) {
    for (const bg of BACKGROUNDS) {
      if (!map[fg] || !map[bg]) {
        console.error(`Token ausente no tema ${theme}: ${fg} ou ${bg}`);
        process.exit(1);
      }
      const value = ratio(map[fg], map[bg]);
      const ok = value >= MIN;
      if (!ok) failures++;
      rows.push(
        `| ${theme} | \`${fg}\` ${map[fg]} | \`${bg}\` ${map[bg]} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} |`,
      );
    }
  }
  for (const fg of ['text', 'text-muted']) {
    for (const bg of BACKGROUNDS) {
      const over = hoverOver(blocks[theme], map[bg]);
      const value = ratio(map[fg], over);
      const ok = value >= MIN;
      if (!ok) failures++;
      rows.push(
        `| ${theme} (hover) | \`${fg}\` ${map[fg]} | hover sobre \`${bg}\` ${over} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} |`,
      );
    }
  }
  const onAccent = ratio(map['on-accent'], map['accent']);
  if (onAccent < MIN) failures++;
  rows.push(
    `| ${theme} | \`on-accent\` ${map['on-accent']} | \`accent\` ${map['accent']} | ${onAccent.toFixed(2)}:1 | ${onAccent >= MIN ? 'ok' : 'FALHA'} |`,
  );
  for (const [pairs, min] of [
    [SOFT_PAIRS, MIN],
    [GRAPHIC_PAIRS, MIN_GRAPHIC],
  ]) {
    for (const [fg, bg] of pairs) {
      if (!map[fg] || !map[bg]) {
        console.error(`Token ausente no tema ${theme}: ${fg} ou ${bg}`);
        process.exit(1);
      }
      const value = ratio(map[fg], map[bg]);
      const ok = value >= min;
      if (!ok) failures++;
      rows.push(
        `| ${theme} | \`${fg}\` ${map[fg]} | \`${bg}\` ${map[bg]} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} (${String(min).replace('.', ',')}:1) |`,
      );
    }
  }
}

for (const [theme, map] of Object.entries(themes)) {
  const surfaces = homeSurfaces(theme, map, blocks[theme]);
  for (const surface of surfaces) {
    for (const fg of HOME_TEXTS) {
      if (!map[fg]) {
        console.error(`Token ausente no tema ${theme}: ${fg}`);
        process.exit(1);
      }
      const value = ratio(map[fg], surface.color);
      const ok = value >= MIN;
      if (!ok) failures++;
      rows.push(
        `| ${theme} (inicio) | \`${fg}\` ${map[fg]} | ${surface.label} ${surface.color} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} |`,
      );
    }
    for (const fg of HOME_MARKS) {
      if (!map[fg]) {
        console.error(`Token ausente no tema ${theme}: ${fg}`);
        process.exit(1);
      }
      const value = ratio(map[fg], surface.color);
      const ok = value >= MIN_GRAPHIC;
      if (!ok) failures++;
      rows.push(
        `| ${theme} (inicio) | \`${fg}\` ${map[fg]} | ${surface.label} ${surface.color} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} (3:1) |`,
      );
    }
  }
  const action = ratio(map['home-on-action'], map['home-action']);
  if (action < MIN) failures++;
  rows.push(
    `| ${theme} (inicio) | \`home-on-action\` ${map['home-on-action']} | \`home-action\` ${map['home-action']} | ${action.toFixed(2)}:1 | ${action >= MIN ? 'ok' : 'FALHA'} |`,
  );
  for (const issuer of ISSUERS) {
    const bg = map[`card-issuer-${issuer}-bg`];
    const mark = map[`card-issuer-${issuer}-mark`];
    const fg = map[`card-issuer-${issuer}-fg`] ?? map['card-issuer-fg'];
    if (!bg || !mark || !fg) {
      console.error(`Token de cartao ausente no tema ${theme}: ${issuer}`);
      process.exit(1);
    }
    for (const [label, color, min] of [
      [map[`card-issuer-${issuer}-fg`] ? `card-issuer-${issuer}-fg` : 'card-issuer-fg', fg, MIN],
      [`card-issuer-${issuer}-mark`, mark, MIN_GRAPHIC],
    ]) {
      const value = ratio(color, bg);
      const ok = value >= min;
      if (!ok) failures++;
      rows.push(
        `| ${theme} (cartao) | \`${label}\` ${color} | \`card-issuer-${issuer}-bg\` ${bg} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} (${String(min).replace('.', ',')}:1) |`,
      );
    }
  }
  for (const [fg, bg, min] of [
    ['ink', 'emerald', MIN],
    ['ink', 'cyan', MIN],
    ['ink', 'cyan-soft', MIN],
  ]) {
    const value = ratio(map[fg], map[bg]);
    const ok = value >= min;
    if (!ok) failures++;
    rows.push(
      `| ${theme} | \`${fg}\` ${map[fg]} | \`${bg}\` ${map[bg]} | ${value.toFixed(2)}:1 | ${ok ? 'ok' : 'FALHA'} |`,
    );
  }
}

if (process.argv.includes('--quiet')) {
  if (failures === 0)
    console.log(`check-contrast: ${rows.length - 2} pares ≥ ${MIN}:1 nos dois temas.`);
} else {
  console.log(rows.join('\n'));
}
if (failures > 0) {
  console.error(
    `\n${failures} par(es) abaixo do mínimo (${MIN}:1 texto, ${MIN_GRAPHIC}:1 gráfico).`,
  );
  process.exit(1);
}
