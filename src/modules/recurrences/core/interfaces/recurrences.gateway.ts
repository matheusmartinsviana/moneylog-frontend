import { Observable } from 'rxjs';

import type {
  Occurrence,
  OccurrenceStatus,
  RealizedTransaction,
  RealizePayment,
  Recurrence,
  RecurrenceInput,
  RecurrenceSummary,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import type {
  RealizeForeign,
  SubscriptionsFilter,
  SubscriptionsPage,
} from '~/modules/recurrences/core/types/subscription';
import type { OccurrenceSlice, Slice } from '~/util/api/slice';

export interface RecurrencesQuery {
  readonly active?: boolean;
  readonly page: number;
  readonly pageSize: number;
}

export interface OccurrencesQuery {
  readonly from?: string;
  readonly to?: string;
  readonly status?: OccurrenceStatus;
  readonly page: number;
  readonly pageSize: number;
}

export interface SubscriptionsQuery extends SubscriptionsFilter {
  readonly page: number;
  readonly pageSize: number;
}

export abstract class RecurrencesGateway {
  abstract list(query: RecurrencesQuery): Observable<Slice<Recurrence>>;
  abstract get(id: string): Observable<Recurrence>;
  abstract create(input: RecurrenceInput, idempotencyKey: string): Observable<Recurrence>;
  abstract update(id: string, input: RecurrenceUpdate): Observable<Recurrence>;
  abstract end(id: string, endDate: string | null): Observable<Recurrence>;
  abstract deactivate(id: string): Observable<Recurrence>;
  abstract summary(): Observable<RecurrenceSummary>;
  abstract listOccurrences(query: OccurrencesQuery): Observable<OccurrenceSlice<Occurrence>>;
  abstract realize(
    recurrenceId: string,
    date: string,
    amount: string | null,
    idempotencyKey: string,
    payment?: RealizePayment | null,
    foreign?: RealizeForeign | null,
  ): Observable<RealizedTransaction>;
  abstract listSubscriptions(query: SubscriptionsQuery): Observable<SubscriptionsPage>;
  abstract cancelSubscription(id: string, activeUntil: string): Observable<Recurrence>;
  abstract skip(recurrenceId: string, date: string): Observable<Occurrence>;
}
