import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import {
  OccurrencesQuery,
  RecurrencesGateway,
  RecurrencesQuery,
  SubscriptionsQuery,
} from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import type {
  Occurrence,
  RealizePayment,
  RealizedTransaction,
  Recurrence,
  RecurrenceInput,
  RecurrenceSummary,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import type {
  RealizeForeign,
  SubscriptionsPage,
} from '~/modules/recurrences/core/types/subscription';
import { IDEMPOTENCY_HEADER, RECURRENCES_ENDPOINTS } from '~/modules/recurrences/infra/endpoints';
import {
  toCreateRequest,
  toOccurrence,
  toRealized,
  toRecurrence,
  toSubscriptionsPage,
  toSummary,
  toUpdateRequest,
} from '~/modules/recurrences/infra/facades/recurrences-response.mapper';
import type {
  OccurrenceResponse,
  OccurrenceSliceResponse,
  RealizedTransactionResponse,
  RealizeRequest,
  RecurrenceEndRequest,
  RecurrenceResponse,
  RecurrenceSliceResponse,
  RecurrenceSummaryResponse,
  SubscriptionListResponse,
} from '~/modules/recurrences/infra/responses/recurrence.response';
import {
  EMPTY_OCCURRENCES,
  EMPTY_RECURRENCE_SUMMARY,
  EMPTY_RECURRENCES,
  EMPTY_SUBSCRIPTIONS,
} from '~/modules/recurrences/mock-data/empty-recurrences';
import { Problem, ProblemError, toProblem } from '~/util/api/problem';
import type { OccurrenceSlice, Slice } from '~/util/api/slice';
import { API_MOCKS } from '~/util/api-mocks';

function fail(error: unknown): Observable<never> {
  return throwError(() => new ProblemError(toProblem(error)));
}

function notFound(): Observable<never> {
  const problem: Problem = {
    status: 404,
    code: 'RECURRENCE_NOT_FOUND',
    fieldErrors: [],
    traceId: null,
    retryAfterSeconds: null,
  };
  return throwError(() => new ProblemError(problem));
}

@Injectable({ providedIn: 'root' })
export class RecurrencesRequestsFacade extends RecurrencesGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(query: RecurrencesQuery): Observable<Slice<Recurrence>> {
    if (this.useMocks) return of(this.toSlice(EMPTY_RECURRENCES));
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http
      .get<RecurrenceSliceResponse>(RECURRENCES_ENDPOINTS.collection, { params })
      .pipe(
        map((slice) => this.toSlice(slice)),
        catchError(fail),
      );
  }

  get(id: string): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    return this.http
      .get<RecurrenceResponse>(RECURRENCES_ENDPOINTS.item(id))
      .pipe(map(toRecurrence), catchError(fail));
  }

  create(input: RecurrenceInput, idempotencyKey: string): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    return this.http
      .post<RecurrenceResponse>(RECURRENCES_ENDPOINTS.collection, toCreateRequest(input), {
        headers: new HttpHeaders().set(IDEMPOTENCY_HEADER, idempotencyKey),
      })
      .pipe(map(toRecurrence), catchError(fail));
  }

  update(id: string, input: RecurrenceUpdate): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    return this.http
      .put<RecurrenceResponse>(RECURRENCES_ENDPOINTS.item(id), toUpdateRequest(input))
      .pipe(map(toRecurrence), catchError(fail));
  }

  end(id: string, endDate: string | null): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    const body: RecurrenceEndRequest = endDate === null ? {} : { endDate };
    return this.http
      .post<RecurrenceResponse>(RECURRENCES_ENDPOINTS.end(id), body)
      .pipe(map(toRecurrence), catchError(fail));
  }

  deactivate(id: string): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    return this.http
      .post<RecurrenceResponse>(RECURRENCES_ENDPOINTS.deactivate(id), null)
      .pipe(map(toRecurrence), catchError(fail));
  }

  summary(): Observable<RecurrenceSummary> {
    if (this.useMocks) return of(toSummary(EMPTY_RECURRENCE_SUMMARY));
    return this.http
      .get<RecurrenceSummaryResponse>(RECURRENCES_ENDPOINTS.summary)
      .pipe(map(toSummary), catchError(fail));
  }

  listOccurrences(query: OccurrencesQuery): Observable<OccurrenceSlice<Occurrence>> {
    if (this.useMocks) return of(this.toOccurrenceSlice(EMPTY_OCCURRENCES));
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.status) params = params.set('status', query.status);
    return this.http
      .get<OccurrenceSliceResponse>(RECURRENCES_ENDPOINTS.occurrences, { params })
      .pipe(
        map((slice) => this.toOccurrenceSlice(slice)),
        catchError(fail),
      );
  }

  realize(
    recurrenceId: string,
    date: string,
    amount: string | null,
    idempotencyKey: string,
    payment: RealizePayment | null = null,
    foreign: RealizeForeign | null = null,
  ): Observable<RealizedTransaction> {
    if (this.useMocks) return notFound();
    const body: RealizeRequest = {
      ...(amount === null || foreign !== null ? {} : { amount }),
      ...(foreign
        ? {
            originalAmount: { amount: foreign.originalAmount, currency: foreign.currency },
            fxRate: foreign.fxRate,
            iofBps: foreign.iofBps,
          }
        : {}),
      ...(payment ? { accountId: payment.accountId, method: payment.method } : {}),
    };
    return this.http
      .post<RealizedTransactionResponse>(RECURRENCES_ENDPOINTS.realize(recurrenceId, date), body, {
        headers: new HttpHeaders().set(IDEMPOTENCY_HEADER, idempotencyKey),
      })
      .pipe(map(toRealized), catchError(fail));
  }

  listSubscriptions(query: SubscriptionsQuery): Observable<SubscriptionsPage> {
    if (this.useMocks) return of(toSubscriptionsPage(EMPTY_SUBSCRIPTIONS));
    let params = new HttpParams()
      .set('status', query.status)
      .set('page', query.page)
      .set('pageSize', query.pageSize);
    if (query.scope !== null) params = params.set('scope', query.scope);
    return this.http
      .get<SubscriptionListResponse>(RECURRENCES_ENDPOINTS.subscriptions, { params })
      .pipe(map(toSubscriptionsPage), catchError(fail));
  }

  cancelSubscription(id: string, activeUntil: string): Observable<Recurrence> {
    if (this.useMocks) return notFound();
    const body: RecurrenceEndRequest = { activeUntil };
    return this.http
      .post<RecurrenceResponse>(RECURRENCES_ENDPOINTS.end(id), body)
      .pipe(map(toRecurrence), catchError(fail));
  }

  skip(recurrenceId: string, date: string): Observable<Occurrence> {
    if (this.useMocks) return notFound();
    return this.http
      .post<OccurrenceResponse>(RECURRENCES_ENDPOINTS.skip(recurrenceId, date), null)
      .pipe(map(toOccurrence), catchError(fail));
  }

  private toSlice(slice: RecurrenceSliceResponse): Slice<Recurrence> {
    return { items: slice.items.map(toRecurrence), hasNext: slice.hasNext };
  }

  private toOccurrenceSlice(slice: OccurrenceSliceResponse): OccurrenceSlice<Occurrence> {
    return {
      items: slice.items.map(toOccurrence),
      hasNext: slice.hasNext,
      overdueTruncated: slice.overdueTruncated ?? false,
    };
  }
}
