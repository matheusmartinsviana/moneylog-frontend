import type { Language } from '~/app/common/i18n/i18n';

export const MIN_DATE = '2000-01-01';
export const MAX_DATE = '2100-12-31';

export type DateOrder = 'dmy' | 'mdy';

export interface Civil {
  readonly y: number;
  readonly m: number;
  readonly d: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function utc(y: number, m: number, d: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  return date;
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

export function toIso(y: number, m: number, d: number): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function daysInMonth(y: number, m: number): number {
  return utc(y, m + 1, 0).getUTCDate();
}

export function parseIso(iso: string): Civil | null {
  const match = ISO.exec(iso);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m) ? { y, m, d } : null;
}

export function weekday(iso: string): number {
  const c = parseIso(iso);
  return c ? utc(c.y, c.m, c.d).getUTCDay() : 0;
}

export function addDays(iso: string, days: number): string {
  const c = parseIso(iso);
  if (!c) return iso;
  const date = utc(c.y, c.m, c.d + days);
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addMonths(iso: string, months: number): string {
  const c = parseIso(iso);
  if (!c) return iso;
  const index = c.y * 12 + (c.m - 1) + months;
  const y = Math.floor(index / 12);
  const m = (((index % 12) + 12) % 12) + 1;
  return toIso(y, m, Math.min(c.d, daysInMonth(y, m)));
}

export function clampIso(iso: string, min: string, max: string): string {
  return iso < min ? min : iso > max ? max : iso;
}

export function monthGrid(month: string, weekStart: 0 | 1): (string | null)[][] {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const first = toIso(y, m, 1);
  const offset = (weekday(first) - weekStart + 7) % 7;
  const total = daysInMonth(y, m);
  const cells: (string | null)[] = Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= total ? toIso(y, m, day) : null;
  });
  return Array.from({ length: 6 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

export function dateOrder(language: Language): DateOrder {
  return language === 'en' ? 'mdy' : 'dmy';
}

export function weekStart(language: Language): 0 | 1 {
  return language === 'es' ? 1 : 0;
}

export function maskDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function formatMasked(iso: string, order: DateOrder): string {
  const c = parseIso(iso);
  if (!c) return '';
  return order === 'mdy'
    ? `${pad(c.m)}/${pad(c.d)}/${pad(c.y, 4)}`
    : `${pad(c.d)}/${pad(c.m)}/${pad(c.y, 4)}`;
}

export function parseMasked(text: string, order: DateOrder): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const y = Number(match[3]);
  const [m, d] = order === 'mdy' ? [a, b] : [b, a];
  const iso = toIso(y, m, d);
  return parseIso(iso) ? iso : null;
}

export function addMonthsToMonth(month: string, months: number): string {
  return addMonths(`${month}-01`, months).slice(0, 7);
}
