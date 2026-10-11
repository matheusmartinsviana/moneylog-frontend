import type { Money } from '~/util/money';

export interface DashboardSummary {
  readonly asOf: string;
  readonly isProjection: boolean;
  readonly hasAccounts: boolean;
  readonly balances: DashboardBalances;
  readonly committed: CommittedHorizons;
  readonly projected: ProjectedHorizons;
  readonly month: MonthSummary;
  readonly netWorth: NetWorth;
}

export interface DashboardBalances {
  readonly inAccounts: Money;
  readonly investments: Money;
  readonly available: Money;
  readonly reserved: Money;
  readonly committed30d: Money;
  readonly inAccountsChange: InAccountsChange | null;
}

export interface InAccountsChange {
  readonly previous: Money;
  readonly amount: Money;
  readonly percent: string | null;
  readonly since: string;
}

export interface CommittedHorizons {
  readonly d7: Money;
  readonly d30: Money;
  readonly d60: Money;
  readonly d90: Money;
  readonly m6: Money;
  readonly m12: Money;
}

export interface ProjectedHorizons {
  readonly d30: Money;
  readonly d90: Money;
  readonly m6: Money;
  readonly m12: Money;
}

export const PAYMENT_METHODS = ['DEBIT', 'PIX', 'CASH', 'BOLETO', 'TRANSFER', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface ExpensesPaid {
  readonly total: Money;
  readonly byMethod: Readonly<Record<PaymentMethod, Money>>;
}

export interface CashFlow {
  readonly in: Money;
  readonly out: Money;
  readonly net: Money;
}

export interface MonthSummary {
  readonly competence: string;
  readonly income: Money;
  readonly expensesPaid: ExpensesPaid;
  readonly credit: Money;
  readonly refunds: Money;
  readonly consumption: Money;
  readonly debtConsumption: Money | null;
  readonly cashFlow: CashFlow;
  readonly investedNet: Money;
  readonly lent: Money;
  readonly received: Money;
  readonly net: Money;
}

export interface NetWorth {
  readonly accounts: Money;
  readonly receivables: Money;
  readonly cardLiabilities: Money;
  readonly payables: Money;
  readonly total: Money;
  readonly cardFutureInstallments: Money;
}
