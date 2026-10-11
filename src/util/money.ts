export interface Money {
  readonly amount: string;
  readonly currency: string;
}

export const CURRENCY_LOCALE: Readonly<Record<string, string>> = {
  BRL: 'pt-BR',
  USD: 'en-US',
};

export const FALLBACK_MONEY_LOCALE = 'pt-BR';

export const TYPOGRAPHIC_MINUS = '−';

const DECIMAL = /^-?\d+(?:\.(\d+))?$/;
const CURRENCY_CODE = /^[A-Z]{3}$/;
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const locale = CURRENCY_LOCALE[currency] ?? FALLBACK_MONEY_LOCALE;
    const currencyDigits =
      new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currencyDigits,
      maximumFractionDigits: Math.max(currencyDigits, fractionDigits),
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatMoney(money: Money): string {
  const match = DECIMAL.exec(money.amount);
  if (!match || !CURRENCY_CODE.test(money.currency)) {
    return `${money.amount} ${money.currency}`;
  }
  const fractionDigits = match[1]?.length ?? 0;
  return formatterFor(money.currency, fractionDigits)
    .formatToParts(money.amount as Intl.StringNumericLiteral)
    .map((part) => (part.type === 'minusSign' ? TYPOGRAPHIC_MINUS : part.value))
    .join('');
}

const NEGATIVE_ZERO = /^-0+(?:\.0+)?$/;

export function isNegative(money: Money): boolean {
  return money.amount.startsWith('-') && !NEGATIVE_ZERO.test(money.amount);
}

export function isPositive(money: Money): boolean {
  return !money.amount.startsWith('-') && /[1-9]/.test(money.amount);
}

export function withoutSign(money: Money): Money {
  return money.amount.startsWith('-') ? { ...money, amount: money.amount.slice(1) } : money;
}
