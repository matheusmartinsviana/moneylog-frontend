import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type {
  GeneratedIncomeOccurrence,
  IncomePreview,
  IncomeProfile,
  IncomeProfileInput,
  IncomeProfileStatus,
  IncomeProfileUpdate,
  TaxTable,
} from '~/modules/income/core/types/income';
import { IDEMPOTENCY_HEADER, INCOME_ENDPOINTS } from '~/modules/income/infra/endpoints';
import {
  toCreateRequest,
  toGeneratedOccurrences,
  toIncomePreview,
  toIncomeProfile,
  toTaxTables,
  toUpdateRequest,
} from '~/modules/income/infra/facades/income-response.mapper';
import type {
  GeneratedIncomeResponse,
  IncomePreviewResponse,
  IncomeProfileResponse,
  IncomeProfileSliceResponse,
  TaxTableListResponse,
} from '~/modules/income/infra/responses/income.response';
import {
  EMPTY_GENERATED_INCOME,
  EMPTY_INCOME_PROFILES,
  emptyTaxTables,
} from '~/modules/income/mock-data/empty-income';
import { Problem, ProblemError, toProblem } from '~/util/api/problem';
import type { Slice } from '~/util/api/slice';
import { API_MOCKS } from '~/util/api-mocks';

function fail(error: unknown): Observable<never> {
  return throwError(() => new ProblemError(toProblem(error)));
}

function notFound(): Observable<never> {
  const problem: Problem = {
    status: 404,
    code: 'INCOME_PROFILE_NOT_FOUND',
    fieldErrors: [],
    traceId: null,
    retryAfterSeconds: null,
  };
  return throwError(() => new ProblemError(problem));
}

@Injectable({ providedIn: 'root' })
export class IncomeRequestsFacade extends IncomeGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(
    status: IncomeProfileStatus,
    page: number,
    pageSize: number,
  ): Observable<Slice<IncomeProfile>> {
    if (this.useMocks) return of(this.toSlice(EMPTY_INCOME_PROFILES));
    const params = new HttpParams()
      .set('status', status)
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<IncomeProfileSliceResponse>(INCOME_ENDPOINTS.profiles, { params }).pipe(
      map((slice) => this.toSlice(slice)),
      catchError(fail),
    );
  }

  create(input: IncomeProfileInput, idempotencyKey: string): Observable<IncomeProfile> {
    if (this.useMocks) return notFound();
    return this.http
      .post<IncomeProfileResponse>(INCOME_ENDPOINTS.profiles, toCreateRequest(input), {
        headers: new HttpHeaders().set(IDEMPOTENCY_HEADER, idempotencyKey),
      })
      .pipe(map(toIncomeProfile), catchError(fail));
  }

  update(id: string, input: IncomeProfileUpdate): Observable<IncomeProfile> {
    if (this.useMocks) return notFound();
    return this.http
      .put<IncomeProfileResponse>(INCOME_ENDPOINTS.profile(id), toUpdateRequest(input))
      .pipe(map(toIncomeProfile), catchError(fail));
  }

  archive(id: string): Observable<IncomeProfile> {
    if (this.useMocks) return notFound();
    return this.http
      .post<IncomeProfileResponse>(INCOME_ENDPOINTS.archive(id), null)
      .pipe(map(toIncomeProfile), catchError(fail));
  }

  preview(id: string, month: string): Observable<IncomePreview> {
    if (this.useMocks) return notFound();
    const params = new HttpParams().set('month', month);
    return this.http
      .get<IncomePreviewResponse>(INCOME_ENDPOINTS.preview(id), { params })
      .pipe(map(toIncomePreview), catchError(fail));
  }

  generate(id: string, from: string, to: string): Observable<readonly GeneratedIncomeOccurrence[]> {
    if (this.useMocks) return of(toGeneratedOccurrences(EMPTY_GENERATED_INCOME));
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .post<GeneratedIncomeResponse>(INCOME_ENDPOINTS.generate(id), null, { params })
      .pipe(map(toGeneratedOccurrences), catchError(fail));
  }

  taxTables(year: number): Observable<readonly TaxTable[]> {
    if (this.useMocks) return of(toTaxTables(emptyTaxTables(year)));
    const params = new HttpParams().set('year', year);
    return this.http
      .get<TaxTableListResponse>(INCOME_ENDPOINTS.taxTables, { params })
      .pipe(map(toTaxTables), catchError(fail));
  }

  private toSlice(slice: IncomeProfileSliceResponse): Slice<IncomeProfile> {
    return { items: slice.items.map(toIncomeProfile), hasNext: slice.hasNext };
  }
}
