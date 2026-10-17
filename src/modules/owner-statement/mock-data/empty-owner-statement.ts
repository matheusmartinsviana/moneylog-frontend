import type { OwnerStatementResponse } from '~/modules/owner-statement/infra/responses/owner-statement.response';
import { todayIso } from '~/util/date';

const zero = { amount: '0.00', currency: 'BRL' as const };

function addMonths(competence: string, offset: number): string {
  const [year, month] = competence.split('-').map(Number) as [number, number];
  const index = year * 12 + (month - 1) + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function emptyOwnerStatement(from: string | null, months: number): OwnerStatementResponse {
  const first = from ?? todayIso().slice(0, 7);
  return {
    asOf: todayIso(),
    view: 'MINE',
    incomeLagMonths: 1,
    openingBalance: zero,
    months: Array.from({ length: months }, (_, offset) => ({
      competence: addMonths(first, offset),
      income: { total: zero, receivedInAccount: zero, appliedToDebt: zero, items: [] },
      outflow: {
        cardsMine: zero,
        cardsGross: zero,
        subscriptionsMine: zero,
        offCard: { fixed: zero, variable: zero, byMethod: [] },
        realEstateMine: zero,
        total: zero,
      },
      companyReimbursable: zero,
      surplus: zero,
      endBalance: zero,
      negative: false,
      receivablesPending: zero,
    })),
    negativeMonths: [],
    warnings: [],
  };
}
