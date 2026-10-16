import type { MonthlySummaryResponse } from '~/modules/monthly-summary/infra/responses/monthly-summary.response';

const zero = { amount: '0.00', currency: 'BRL' as const };
const noDelta = { amount: zero, percent: null };

export function emptySummary(month: string): MonthlySummaryResponse {
  return {
    view: 'MINE',
    competence: month,
    partial: false,
    isProjection: false,
    income: zero,
    expenses: zero,
    investments: zero,
    net: zero,
    savingsRate: null,
    largestCategory: null,
    largestExpense: null,
    card: { consumption: zero, outstanding: zero },
    futureInstallments: zero,
    comparison: {
      previousMonth: {
        competence: previousMonth(month),
        income: zero,
        expenses: zero,
        investments: zero,
        net: zero,
      },
      incomeDelta: noDelta,
      expensesDelta: noDelta,
      investmentsDelta: noDelta,
      netDelta: noDelta,
    },
  };
}

function previousMonth(month: string): string {
  const [year, number] = month.split('-').map(Number) as [number, number];
  return number === 1 ? `${year - 1}-12` : `${year}-${String(number - 1).padStart(2, '0')}`;
}
