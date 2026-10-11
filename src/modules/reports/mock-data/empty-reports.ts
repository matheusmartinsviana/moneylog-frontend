import type {
  IncomeExpenseSeriesResponse,
  SpendingByCategoryResponse,
} from '~/modules/reports/infra/responses/reports.response';

const zero = () => ({ amount: '0.00', currency: 'BRL' as const });

const AS_OF = '2026-10-10';

export function emptyIncomeExpenseSeries(
  period: IncomeExpenseSeriesResponse['period'],
): IncomeExpenseSeriesResponse {
  const monthly = period === 'M12';
  const weekly = period === 'M3';
  return {
    period,
    from: AS_OF,
    to: AS_OF,
    basis: monthly ? 'COMPETENCE' : 'DATE',
    granularity: monthly ? 'MONTH' : weekly ? 'WEEK' : 'DAY',
    points: [],
    totals: { income: zero(), expenses: zero(), net: zero() },
  };
}

export function emptySpendingByCategory(month: string): SpendingByCategoryResponse {
  return {
    basis: 'COMPETENCE',
    from: `${month}-01`,
    to: `${month}-01`,
    total: zero(),
    base: zero(),
    items: [],
    other: null,
  };
}
