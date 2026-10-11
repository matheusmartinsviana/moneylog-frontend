import type { Money } from '~/util/money';

export const DEBT_OVERVIEW_CURRENCY = 'BRL';

export const DEBT_OVERVIEW_MONTHS = [6, 12, 24] as const;
export type DebtOverviewMonths = (typeof DEBT_OVERVIEW_MONTHS)[number];

export interface DebtPlan {
  readonly purchaseId: string;
  readonly description: string | null;
  readonly ongoing: boolean;
  readonly installmentAmount: Money;
  readonly totalInstallments: number;
  readonly remainingInstallments: number;
  readonly nextInstallmentNumber: number;
  readonly remaining: Money;
  readonly nextDueDate: string;
  readonly lastDueDate: string;
}

export interface DebtCardItem {
  readonly card: { readonly id: string; readonly name: string };
  readonly total: Money;
  readonly invoiced: Money;
  readonly future: Money;
  readonly otherCharges: Money;
  readonly adjustment: Money;
  readonly plans: readonly DebtPlan[];
}

export interface DebtLine {
  readonly debtId: string;
  readonly person: { readonly id: string; readonly name: string } | null;
  readonly creditorName: string;
  readonly description: string | null;
  readonly outstanding: Money;
  readonly expectedDate: string | null;
  readonly overdue: boolean;
}

export interface DebtGroup {
  readonly total: Money;
  readonly items: readonly DebtLine[];
}

export interface SchedulePoint {
  readonly competence: string;
  readonly cards: Money;
  readonly people: Money;
  readonly other: Money;
  readonly total: Money;
  readonly remainingAfter: Money;
}

export interface TrackedItem {
  readonly id: string;
  readonly kind: 'TRACKED_THIRD_PARTY' | 'LONG_TERM_PROJECT';
  readonly name: string;
  readonly counterparty: string | null;
  readonly total: Money | null;
  readonly paid: Money | null;
  readonly nominalBalance: Money | null;
  readonly progress: string | null;
  readonly installmentsTotal: number | null;
  readonly installmentsPaid: number | null;
  readonly remainingInstallments: number | null;
  readonly nextDueDate: string | null;
  readonly directPending: Money | null;
}

export interface TrackedOverview {
  readonly items: readonly TrackedItem[];
  readonly scheduleByMonth: readonly { readonly competence: string; readonly amount: Money }[];
}

export type PayoffReason = 'UNDATED_DEBTS' | 'BEYOND_HORIZON';
export type IncomeSource = 'RECURRING_ESTIMATE' | 'LAST_FULL_MONTH' | 'NONE';

export interface DebtOverview {
  readonly asOf: string;
  readonly total: Money;
  readonly parts: { readonly cards: Money; readonly people: Money; readonly other: Money };
  readonly cards: {
    readonly total: Money;
    readonly invoiced: Money;
    readonly future: Money;
    readonly items: readonly DebtCardItem[];
  };
  readonly people: DebtGroup;
  readonly other: DebtGroup;
  readonly receivablesInfo: Money;
  readonly hasRecords: boolean;
  readonly fixedCosts: { readonly monthly: Money; readonly estimate: boolean };
  readonly income: { readonly monthly: Money | null; readonly source: IncomeSource };
  readonly liquidity: { readonly inAccounts: Money; readonly available: Money };
  readonly comparison: {
    readonly debtToIncome: string | null;
    readonly fixedCostToIncome: string | null;
    readonly debtMinusInAccounts: Money;
    readonly reason: 'NO_INCOME' | null;
  };
  readonly schedule: {
    readonly months: number;
    readonly points: readonly SchedulePoint[];
    readonly overdue: Money;
    readonly undated: Money;
    readonly beyondHorizon: Money;
    readonly payoffCompetence: string | null;
    readonly payoffReason: PayoffReason | null;
  };
  readonly payoffGoal: {
    readonly goalId: string;
    readonly baselineSet: boolean;
    readonly progress: string;
    readonly remaining: Money;
  } | null;
  readonly tracked: TrackedOverview;
}

export interface OngoingInstallmentsInput {
  readonly description: string;
  readonly installmentAmount: string;
  readonly totalInstallments: number;
  readonly remainingInstallments: number;
  readonly firstInvoiceDate: string | null;
}

export interface OngoingPreview {
  readonly remainingInstallments: number;
  readonly installmentAmount: Money;
  readonly remaining: Money;
  readonly firstDueDate: string;
  readonly lastDueDate: string;
}
