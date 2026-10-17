import type { Money } from '~/util/money';
import type { ViewMode } from '~/util/view-mode';

export type ReportPeriod = 'D7' | 'D30' | 'M3' | 'M12';
export const REPORT_PERIODS: readonly ReportPeriod[] = ['D7', 'D30', 'M3', 'M12'];

export type ReportGranularity = 'DAY' | 'WEEK' | 'MONTH';

export interface IncomeExpensePoint {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly partial: boolean;
  readonly income: Money;
  readonly expenses: Money;
  readonly net: Money;
}

export interface IncomeExpenseSeries {
  readonly view: ViewMode;
  readonly period: ReportPeriod;
  readonly from: string;
  readonly to: string;
  readonly basis: 'DATE' | 'COMPETENCE';
  readonly granularity: ReportGranularity;
  readonly points: readonly IncomeExpensePoint[];
  readonly totals: { readonly income: Money; readonly expenses: Money; readonly net: Money };
}

export interface CategoryRef {
  readonly id: string;
  readonly name: string;
}

export interface SpendingCategoryItem {
  readonly category: CategoryRef;
  readonly amount: Money;
  readonly share: string | null;
}

export interface SpendingOther {
  readonly amount: Money;
  readonly share: string | null;
  readonly categories: number;
}

export interface SpendingByCategory {
  readonly view: ViewMode;
  readonly basis: 'COMPETENCE';
  readonly from: string;
  readonly to: string;
  readonly total: Money;
  readonly base: Money;
  readonly items: readonly SpendingCategoryItem[];
  readonly other: SpendingOther | null;
}
