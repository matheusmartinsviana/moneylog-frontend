import { Observable } from 'rxjs';

import type {
  Goal,
  GoalMetric,
  GoalActionInput,
  GoalInput,
  GoalStatus,
  GoalUpdate,
  ReservationInput,
} from '~/modules/goals/core/types/goal';
import type { Slice } from '~/util/api/slice';
import type { Money } from '~/util/money';

export interface GoalsQuery {
  readonly status?: GoalStatus;
  readonly featured?: boolean;
  readonly page: number;
  readonly pageSize: number;
}

export abstract class GoalsGateway {
  abstract list(query: GoalsQuery): Observable<Slice<Goal>>;
  abstract get(id: string): Observable<Goal>;
  abstract create(input: GoalInput, idempotencyKey: string): Observable<Goal>;
  abstract update(id: string, input: GoalUpdate): Observable<Goal>;
  abstract reserve(id: string, input: ReservationInput, idempotencyKey: string): Observable<Goal>;
  abstract baseline(id: string): Observable<Goal>;
  abstract addAction(id: string, input: GoalActionInput): Observable<Goal>;
  abstract updateAction(id: string, actionId: string, input: GoalActionInput): Observable<Goal>;
  abstract deleteAction(id: string, actionId: string): Observable<Goal>;
  abstract checkIn(id: string, actionId: string, period: string, done: boolean): Observable<Goal>;
  abstract metricValue(metric: GoalMetric): Observable<Money>;
  abstract setFeatured(id: string, featured: boolean): Observable<Goal>;
  abstract archive(id: string): Observable<Goal>;
  abstract unarchive(id: string): Observable<Goal>;
}
