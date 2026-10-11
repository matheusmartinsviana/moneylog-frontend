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
