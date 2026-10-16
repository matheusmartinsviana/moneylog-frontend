const RATIO = /^-?\d+(?:\.\d+)?$/;

export interface RatioFormatOptions {
  readonly signed?: boolean;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: string, signed: boolean): Intl.NumberFormat {
  const key = `${locale}:${signed}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      signDisplay: signed ? 'exceptZero' : 'auto',
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatRatio(
  ratio: string,
  locale: string,
  options: RatioFormatOptions = {},
): string {
  if (!RATIO.test(ratio)) return ratio;
  return formatterFor(locale, options.signed === true)
    .formatToParts(ratio as Intl.StringNumericLiteral)
    .map((part) => (part.type === 'minusSign' ? '−' : part.value))
    .join('');
}

export function ratioForBar(ratio: string): number | null {
  if (!RATIO.test(ratio)) return null;
  const value = Number(ratio);
  return Number.isFinite(value) ? value : null;
}

export function ratioSign(ratio: string): 'up' | 'down' | 'flat' {
  if (!RATIO.test(ratio)) return 'flat';
  if (ratio.startsWith('-')) return /[1-9]/.test(ratio) ? 'down' : 'flat';
  return /[1-9]/.test(ratio) ? 'up' : 'flat';
}

export function ratioMagnitude(ratio: string): string {
  return RATIO.test(ratio) ? ratio.replace(/^-/, '') : ratio;
}

export function formatPoints(
  ratio: string,
  locale: string,
  options: RatioFormatOptions = {},
): string {
  if (!RATIO.test(ratio)) return ratio;
  return formatterFor(locale, options.signed === true)
    .formatToParts(ratio as Intl.StringNumericLiteral)
    .filter((part) => part.type !== 'percentSign')
    .map((part) => (part.type === 'minusSign' ? '−' : part.value))
    .join('')
    .trim();
}

const BPS_TEXT = /^\d{1,3}(?:[.,]\d{1,2})?$/;

export function formatBps(bps: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(bps / 10000);
}

export function bpsToPercentText(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = bps % 100;
  if (fraction === 0) return String(whole);
  return `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
}

export function percentTextToBps(text: string): number | null {
  const value = text.trim();
  if (!BPS_TEXT.test(value)) return null;
  const [whole = '0', fraction = ''] = value.replace(',', '.').split('.');
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return bps <= 10000 ? bps : null;
}
