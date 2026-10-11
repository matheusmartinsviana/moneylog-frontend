import type { Money } from '~/util/money';

export interface Ref {
  readonly id: string;
  readonly name: string;
}

export interface SummaryDelta {
  readonly amount: Money;
  readonly percent: string | null;
}

export interface SummaryTotals {
  readonly competence: string;
  readonly income: Money;
  readonly expenses: Money;
  readonly investments: Money;
  readonly net: Money;
  readonly savingsRate: string | null;
}

export interface SummaryComparison {
  readonly previousMonth: SummaryTotals;
  readonly incomeDelta: SummaryDelta;
  readonly expensesDelta: SummaryDelta;
  readonly investmentsDelta: SummaryDelta;
  readonly netDelta: SummaryDelta;
  readonly savingsRateDelta: string | null;
}

export interface LargestCategory {
  readonly category: Ref;
  readonly amount: Money;
}

export interface LargestExpense {
  readonly transactionId: string | null;
  readonly debtId: string | null;
  readonly description: string | null;
  readonly category: Ref;
  readonly date: string;
  readonly amount: Money;
  readonly installmentNumber: number | null;
  readonly installmentTotal: number | null;
}

export interface MonthlySummary {
  readonly competence: string;
  readonly partial: boolean;
  readonly isProjection: boolean;
  readonly income: Money;
  readonly expenses: Money;
  readonly investments: Money;
  readonly net: Money;
  readonly savingsRate: string | null;
  readonly largestCategory: LargestCategory | null;
  readonly largestExpense: LargestExpense | null;
  readonly card: { readonly consumption: Money; readonly outstanding: Money };
  readonly futureInstallments: Money;
  readonly comparison: SummaryComparison;
}
