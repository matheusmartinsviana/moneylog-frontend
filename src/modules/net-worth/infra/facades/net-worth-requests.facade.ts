import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { NetWorthGateway } from '~/modules/net-worth/core/interfaces/net-worth.gateway';
import type { NetWorthOverview } from '~/modules/net-worth/core/types/net-worth';
import { NET_WORTH_ENDPOINTS } from '~/modules/net-worth/infra/endpoints';
import type { NetWorthOverviewResponse } from '~/modules/net-worth/infra/responses/net-worth.response';
import { EMPTY_NET_WORTH } from '~/modules/net-worth/mock-data/empty-net-worth';
import { ProblemError, toProblem } from '~/util/api/problem';
import { API_MOCKS } from '~/util/api-mocks';

const money = (value: { amount: string; currency: string }) => ({
  amount: value.amount,
  currency: value.currency,
});

const moneyOrNull = (value: { amount: string; currency: string } | null | undefined) =>
  value ? money(value) : null;

export function toNetWorthOverview(response: NetWorthOverviewResponse): NetWorthOverview {
  const reserve = response.emergencyReserve;
  return {
    availableCash: money(response.availableCash),
    availableAssets: money(response.availableAssets),
    reservedAssets: money(response.reservedAssets),
    receivablesPending: money(response.receivablesPending),
    debts: money(response.debts),
    emergencyReserve: {
      amount: money(reserve.amount),
      monthlyBase: money(reserve.monthlyBase),
      coverageMonths: reserve.coverageMonths,
      targetMonths: reserve.targetMonths,
      targetAmount: moneyOrNull(reserve.targetAmount),
      missingToTarget: moneyOrNull(reserve.missingToTarget),
    },
  };
}

function fail(error: unknown): Observable<never> {
  return throwError(() => new ProblemError(toProblem(error)));
}

@Injectable({ providedIn: 'root' })
export class NetWorthRequestsFacade extends NetWorthGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  overview(targetMonths: number | null): Observable<NetWorthOverview> {
    if (this.useMocks) return of(toNetWorthOverview(EMPTY_NET_WORTH));
    let params = new HttpParams();
    if (targetMonths !== null) params = params.set('targetMonths', targetMonths);
    return this.http
      .get<NetWorthOverviewResponse>(NET_WORTH_ENDPOINTS.overview, { params })
      .pipe(map(toNetWorthOverview), catchError(fail));
  }
}
