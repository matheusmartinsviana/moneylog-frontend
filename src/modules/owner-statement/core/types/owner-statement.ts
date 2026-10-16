import type { Money } from '~/util/money';

export type StatementIncomeStatus = 'PLANNED' | 'RECEIVED';

export interface StatementIncomeItem {
  readonly refId: string | null;
  readonly date: string;
  readonly amount: Money;
  readonly status: StatementIncomeStatus;
  readonly estimated: boolean;
}

export interface StatementIncome {
  readonly total: Money;
  readonly receivedInAccount: Money | null;
  readonly appliedToDebt: Money | null;
  readonly items: readonly StatementIncomeItem[];
}

export interface StatementOutflow {
  readonly cardsMine: Money;
  readonly cardsGross: Money;
  readonly subscriptionsMine: Money;
  readonly fixed: Money;
  readonly variable: Money;
  readonly realEstateMine: Money;
  readonly total: Money;
}

export interface StatementMonth {
  readonly competence: string;
  readonly income: StatementIncome;
  readonly outflow: StatementOutflow;
  readonly companyReimbursable: Money;
  readonly surplus: Money;
  readonly endBalance: Money;
  readonly negative: boolean;
  readonly receivablesPending: Money;
}

export interface StatementWarning {
  readonly code: string;
  readonly competence: string | null;
}

export interface OwnerStatement {
  readonly asOf: string;
  readonly openingBalance: Money;
  readonly months: readonly StatementMonth[];
  readonly negativeMonths: readonly string[];
  readonly warnings: readonly StatementWarning[];
}

export interface OwnerStatementQuery {
  readonly from: string | null;
  readonly months: number;
}
