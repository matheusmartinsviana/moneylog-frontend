import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { ReportsGateway } from '~/modules/reports/core/interfaces/reports.gateway';
import type {
  IncomeExpenseSeries,
  ReportPeriod,
  SpendingByCategory,
} from '~/modules/reports/core/types/reports';
import { REPORTS_ENDPOINTS } from '~/modules/reports/infra/endpoints';
import {
  toIncomeExpenseSeries,
  toSpendingByCategory,
} from '~/modules/reports/infra/facades/reports-response.mapper';
import type {
  IncomeExpenseSeriesResponse,
  SpendingByCategoryResponse,
} from '~/modules/reports/infra/responses/reports.response';
import {
  emptyIncomeExpenseSeries,
  emptySpendingByCategory,
} from '~/modules/reports/mock-data/empty-reports';
import { ProblemError, toProblem } from '~/util/api/problem';
import { API_MOCKS, mockResponse } from '~/util/api-mocks';

const fail = (error: unknown) => throwError(() => new ProblemError(toProblem(error)));

@Injectable()
export class ReportsRequestsFacade extends ReportsGateway {
  readonly isDemo = false;
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  incomeExpenses(period: ReportPeriod): Observable<IncomeExpenseSeries> {
    const source: Observable<IncomeExpenseSeriesResponse> = this.useMocks
      ? of(
          mockResponse(
            `${REPORTS_ENDPOINTS.incomeExpenses}?period=${period}`,
            emptyIncomeExpenseSeries(period),
          ),
        )
      : this.http.get<IncomeExpenseSeriesResponse>(REPORTS_ENDPOINTS.incomeExpenses, {
          params: new HttpParams().set('period', period),
        });
    return source.pipe(map(toIncomeExpenseSeries), catchError(fail));
  }

  spendingByCategory(month: string, limit = 5): Observable<SpendingByCategory> {
    const source: Observable<SpendingByCategoryResponse> = this.useMocks
      ? of(
          mockResponse(
            `${REPORTS_ENDPOINTS.spendingByCategory}?month=${month}`,
            emptySpendingByCategory(month),
          ),
        )
      : this.http.get<SpendingByCategoryResponse>(REPORTS_ENDPOINTS.spendingByCategory, {
          params: new HttpParams().set('month', month).set('limit', limit),
        });
    return source.pipe(map(toSpendingByCategory), catchError(fail));
  }
}
