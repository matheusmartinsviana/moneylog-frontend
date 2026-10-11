import { CURRENCY_LOCALE, FALLBACK_MONEY_LOCALE } from '~/util/money';

export type AmountError = 'required' | 'format' | 'scale' | 'negative' | 'zero';

export interface AmountRules {
  readonly allowNegative?: boolean;
  readonly allowZero?: boolean;
}

export type AmountResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: AmountError };

export interface DecimalSymbols {
  readonly decimal: string;
  readonly group: string;
}

const MINUS = /^[-−]/;
const DIGITS = /^\d*$/;
const ONLY_ZEROS = /^0*$/;
const CANONICAL = /^(-?)(\d+)(?:\.(\d+))?$/;
const symbolsCache = new Map<string, DecimalSymbols>();

export function amountLocale(currency: string): string {
  return CURRENCY_LOCALE[currency] ?? FALLBACK_MONEY_LOCALE;
}

export function decimalSymbols(currency: string): DecimalSymbols {
  const locale = amountLocale(currency);
  let symbols = symbolsCache.get(locale);
  if (!symbols) {
    const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(
      '1234.5' as Intl.StringNumericLiteral,
    );
    symbols = {
      decimal: parts.find((part) => part.type === 'decimal')?.value ?? ',',
      group: parts.find((part) => part.type === 'group')?.value ?? '.',
    };
    symbolsCache.set(locale, symbols);
  }
  return symbols;
}

function scaleOf(currency: string) {
  return (
    new Intl.NumberFormat(amountLocale(currency), { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function amountScale(currency: string): string {
  return String(scaleOf(currency));
}

function escape(symbol: string): string {
  return symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function count(text: string, symbol: string) {
  return text.split(symbol).length - 1;
}

function build(
  negative: boolean,
  integer: string,
  fraction: string,
  currency: string,
  rules: AmountRules,
): AmountResult {
  const scale = scaleOf(currency);
  if (fraction.length > scale) return { ok: false, error: 'scale' };
  const digits = integer.replace(/^0+(?=\d)/, '') || '0';
  const decimals = fraction.padEnd(scale, '0');
  const zero = ONLY_ZEROS.test(digits) && ONLY_ZEROS.test(decimals);
  if (zero && !rules.allowZero) return { ok: false, error: 'zero' };
  if (negative && !zero && !rules.allowNegative) return { ok: false, error: 'negative' };
  const sign = negative && !zero ? '-' : '';
  return { ok: true, value: decimals ? `${sign}${digits}.${decimals}` : `${sign}${digits}` };
}

export function parseAmountInput(
  text: string,
  currency: string,
  rules: AmountRules = {},
): AmountResult {
  const { decimal, group } = decimalSymbols(currency);
  let raw = text.replace(/\s/g, '').replace(currencySymbol(currency), '');
  if (raw === '') return { ok: false, error: 'required' };

  const negative = MINUS.test(raw);
  if (negative) raw = raw.slice(1);
  if (raw === '' || !new RegExp(`^[\\d${escape(decimal)}${escape(group)}]+$`).test(raw)) {
    return { ok: false, error: 'format' };
  }

  let integer = raw;
  let fraction = '';
  const decimals = count(raw, decimal);
  if (decimals > 1) return { ok: false, error: 'format' };
  if (decimals === 1) {
    [integer = '', fraction = ''] = raw.split(decimal);
  } else if (count(raw, group) === 1 && /^\d{1,2}$/.test(raw.split(group)[1] ?? '')) {
    [integer = '', fraction = ''] = raw.split(group);
  }

  if (!DIGITS.test(fraction)) return { ok: false, error: 'format' };
  if (integer.includes(group)) {
    if (!new RegExp(`^\\d{1,3}(?:${escape(group)}\\d{3})+$`).test(integer)) {
      return { ok: false, error: 'format' };
    }
    integer = integer.split(group).join('');
  }
  if (!DIGITS.test(integer) || (integer === '' && fraction === '')) {
    return { ok: false, error: 'format' };
  }
  return build(negative, integer, fraction, currency, rules);
}

export function normalizeAmount(
  value: string | null | undefined,
  currency: string,
  rules: AmountRules = {},
): AmountResult {
  if (value === null || value === undefined || value === '') {
    return { ok: false, error: 'required' };
  }
  const match = CANONICAL.exec(value);
  if (!match) return { ok: false, error: 'format' };
  return build(match[1] === '-', match[2] ?? '', match[3] ?? '', currency, rules);
}

export function formatAmountInput(value: string, currency: string): string {
  const scale = scaleOf(currency);
  return new Intl.NumberFormat(amountLocale(currency), {
    useGrouping: true,
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  }).format(value as Intl.StringNumericLiteral);
}

export function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat(amountLocale(currency), { style: 'currency', currency })
      .formatToParts('0' as Intl.StringNumericLiteral)
      .find((part) => part.type === 'currency')?.value ?? currency
  );
}
