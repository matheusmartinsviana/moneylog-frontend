import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  exhaustMap,
  expand,
  map,
  Observable,
  of,
  reduce,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { RecurrencesGateway } from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import type {
  RecurrenceScope,
  SubscriptionsFilter,
  SubscriptionsOverview,
  SubscriptionsPage,
  SubscriptionStatusFilter,
} from '~/modules/recurrences/core/types/subscription';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type SubscriptionsState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly overview: SubscriptionsOverview }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly overview: SubscriptionsOverview };

interface CancelCommand {
  readonly id: string;
  readonly activeUntil: string;
}

const LOADING: SubscriptionsState = { status: 'loading' };

const STALE_CODES: ReadonlySet<string> = new Set([
  'VERSION_CONFLICT',
  'RECURRENCE_ENDED',
  'RECURRENCE_INACTIVE',
]);

@Injectable()
export class SubscriptionsFacade {
  private readonly gateway = inject(RecurrencesGateway);
  private readonly loads = new Subject<{
    readonly filter: SubscriptionsFilter;
    readonly silent: boolean;
  }>();
  private readonly cancels = new Subject<CancelCommand>();
  private readonly canceledEvents = new Subject<string>();
  private readonly current = signal<SubscriptionsState>(LOADING);
  private readonly filterState = signal<SubscriptionsFilter>({ status: 'ACTIVE', scope: null });
  private readonly busyState = signal(false);
  private readonly problemState = signal<Problem | null>(null);

  readonly state = this.current.asReadonly();
  readonly filter = this.filterState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canceled$ = this.canceledEvents.asObservable();
  readonly overview = computed(() => {
    const state = this.current();
    return state.status === 'ready' || state.status === 'empty' ? state.overview : null;
  });
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly overlappingIds = computed(
    () =>
      new Set(
        (this.overview()?.overlaps ?? []).flatMap((overlap) => overlap.items.map((i) => i.id)),
      ),
  );

  constructor() {
    this.loads
      .pipe(
        switchMap(({ filter, silent }) =>
          this.loadAll(filter).pipe(
            map((overview): SubscriptionsState =>
              overview.items.length === 0
                ? { status: 'empty', overview }
                : { status: 'ready', overview },
            ),
            startWith(silent ? this.current() : LOADING),
            catchError((error: unknown) =>
              of<SubscriptionsState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));

    this.cancels
      .pipe(
        exhaustMap((command) => {
          this.busyState.set(true);
          this.problemState.set(null);
          return this.gateway.cancelSubscription(command.id, command.activeUntil).pipe(
            tap((recurrence) => {
              this.canceledEvents.next(recurrence.id);
              this.loads.next({ filter: this.filterState(), silent: true });
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.busyState.set(false);
        this.problemState.set(problem);
        if (problem && STALE_CODES.has(problem.code)) {
          this.loads.next({ filter: this.filterState(), silent: true });
        }
      });
  }

  load(): void {
    this.loads.next({ filter: this.filterState(), silent: false });
  }

  setStatus(status: SubscriptionStatusFilter): void {
    this.filterState.update((filter) => ({ ...filter, status }));
    this.load();
  }

  setScope(scope: RecurrenceScope | null): void {
    this.filterState.update((filter) => ({ ...filter, scope }));
    this.load();
  }

  cancel(id: string, activeUntil: string): void {
    this.cancels.next({ id, activeUntil });
  }

  clearProblem(): void {
    this.problemState.set(null);
  }

  private loadAll(filter: SubscriptionsFilter): Observable<SubscriptionsOverview> {
    const page = (n: number) =>
      this.gateway.listSubscriptions({ ...filter, page: n, pageSize: MAX_PAGE_SIZE });
    return page(1).pipe(
      expand((result, index) => (result.hasNext ? page(index + 2) : EMPTY)),
      reduce((all: SubscriptionsPage, result): SubscriptionsPage => ({
        ...all,
        items: [...all.items, ...result.items],
      })),
      map((all): SubscriptionsOverview => ({
        items: all.items,
        totalMonthly: all.totalMonthly,
        totalMonthlyMine: all.totalMonthlyMine,
        byScope: all.byScope,
        overlaps: all.overlaps,
      })),
    );
  }
}
