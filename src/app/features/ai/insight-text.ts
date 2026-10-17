import type { AppI18n } from '~/app/common/i18n/i18n';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { Insight } from '~/modules/ai/core/types/ai';
import { formatMoney, maskedMoney } from '~/util/money';

const DATA_CURRENCY = 'BRL';
const PERCENT_POINTS = /^-?\d+(?:\.\d+)?$/;

const formatters = new Map<string, Intl.NumberFormat>();

function formatPercentPoints(value: string, locale: string): string {
  if (!PERCENT_POINTS.test(value)) return value;
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    formatters.set(locale, formatter);
  }
  const unsigned = value.startsWith('-') ? value.slice(1) : value;
  return `${formatter.format(unsigned as Intl.StringNumericLiteral)}%`;
}

const money = (amount: string | undefined, masked: boolean) =>
  masked
    ? maskedMoney(DATA_CURRENCY)
    : formatMoney({ amount: amount ?? '0', currency: DATA_CURRENCY });

export function insightText(
  insight: Insight,
  copy: AppI18n['ai']['insights'],
  locale: string,
  maskValues = false,
): string | null {
  const p = insight.params;
  switch (insight.key) {
    case 'insight.category.up':
    case 'insight.category.down': {
      if (p['categoryName'] === undefined || p['deltaPercent'] === undefined) return null;
      return interpolate(
        insight.key === 'insight.category.up' ? copy.categoryUp : copy.categoryDown,
        {
          category: p['categoryName'],
          percent: formatPercentPoints(p['deltaPercent'], locale),
          previous: money(p['previous'], maskValues),
          current: money(p['current'], maskValues),
        },
      );
    }
    case 'insight.card.committed':
      if (p['amount'] === undefined) return null;
      return interpolate(copy.cardCommitted, { amount: money(p['amount'], maskValues) });
    default:
      return null;
  }
}

export interface InsightLine {
  readonly id: string;
  readonly text: string;
  readonly categoryId: string | null;
}

export function insightLines(
  insights: readonly Insight[],
  copy: AppI18n['ai']['insights'],
  locale: string,
): InsightLine[] {
  const lines: InsightLine[] = [];
  insights.forEach((insight, index) => {
    const text = insightText(insight, copy, locale);
    if (text !== null)
      lines.push({
        id: `${insight.key}-${index}`,
        text,
        categoryId: insight.params['categoryId'] ?? null,
      });
  });
  return lines;
}
