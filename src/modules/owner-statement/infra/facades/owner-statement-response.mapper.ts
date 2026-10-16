import type {
  OwnerStatement,
  StatementIncomeItem,
  StatementMonth,
} from '~/modules/owner-statement/core/types/owner-statement';
import type {
  OwnerIncomeItemResponse,
  OwnerStatementMonthResponse,
  OwnerStatementResponse,
} from '~/modules/owner-statement/infra/responses/owner-statement.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

const item = (value: OwnerIncomeItemResponse): StatementIncomeItem => ({
  refId: value.refId,
  date: value.date,
  amount: money(value.amount),
  status: value.status,
  estimated: value.confidence === 'ESTIMATED',
});

const month = (value: OwnerStatementMonthResponse): StatementMonth => ({
  competence: value.competence,
  income: {
    total: money(value.income.total),
    receivedInAccount: value.income.receivedInAccount
      ? money(value.income.receivedInAccount)
      : null,
    appliedToDebt: value.income.appliedToDebt ? money(value.income.appliedToDebt) : null,
    items: value.income.items.map(item),
  },
  outflow: {
    cardsMine: money(value.outflow.cardsMine),
    cardsGross: money(value.outflow.cardsGross),
    subscriptionsMine: money(value.outflow.subscriptionsMine),
    fixed: money(value.outflow.offCard.fixed),
    variable: money(value.outflow.offCard.variable),
    realEstateMine: money(value.outflow.realEstateMine),
    total: money(value.outflow.total),
  },
  companyReimbursable: money(value.companyReimbursable),
  surplus: money(value.surplus),
  endBalance: money(value.endBalance),
  negative: value.negative,
  receivablesPending: money(value.receivablesPending),
});

export function toOwnerStatement(value: OwnerStatementResponse): OwnerStatement {
  return {
    asOf: value.asOf,
    openingBalance: money(value.openingBalance),
    months: value.months.map(month),
    negativeMonths: [...value.negativeMonths],
    warnings: value.warnings.map((warning) => ({
      code: warning.code,
      competence: warning.competence,
    })),
  };
}
