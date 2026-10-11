import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  IncomeExpenseSeries,
  ReportPeriod,
  SpendingByCategory,
} from '~/modules/reports/core/types/reports';

export abstract class ReportsGateway {
  abstract readonly isDemo: boolean;
  abstract incomeExpenses(period: ReportPeriod): Observable<IncomeExpenseSeries>;
  abstract spendingByCategory(month: string, limit?: number): Observable<SpendingByCategory>;
}

export const DEMO_REPORTS_GATEWAY = new InjectionToken<ReportsGateway | null>(
  'DEMO_REPORTS_GATEWAY',
  { providedIn: 'root', factory: () => null },
);
