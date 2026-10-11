import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY as NEVER_EMITS,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { DashboardGateway } from '~/modules/dashboard/core/interfaces/dashboard.gateway';
import {
  DashboardFailure,
  DashboardFailureReason,
} from '~/modules/dashboard/core/types/dashboard-failure';
import type { DashboardSummary } from '~/modules/dashboard/core/types/dashboard-summary';
import type { Upcoming } from '~/modules/dashboard/core/types/upcoming';
import { LEDGER_GATE } from '~/util/api/ledger-gate';

export interface DashboardOverview {
  readonly summary: DashboardSummary;
  readonly upcoming: Upcoming;
}

export type DashboardState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly reason: DashboardFailureReason }
  | { readonly status: 'ready'; readonly data: DashboardOverview };

const LOADING: DashboardState = { status: 'loading' };
const EMPTY: DashboardState = { status: 'empty' };

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

function settle<T>(source: Observable<T>): Observable<Settled<T>> {
  return source.pipe(
    map((value): Settled<T> => ({ ok: true, value })),
    catchError((error: unknown) => of<Settled<T>>({ ok: false, error })),
  );
}

function failureReason(error: unknown): DashboardFailureReason {
  return error instanceof DashboardFailure ? error.reason : 'unavailable';
}

@Injectable()
export class DashboardFacade {
  private readonly gateway = inject(DashboardGateway);
  private readonly gate = inject(LEDGER_GATE, { optional: true });
  private readonly loads = new Subject<boolean>();
  private readonly refreshFailedState = signal(false);
  private readonly current = signal<DashboardState>(LOADING);

  readonly state = this.current.asReadonly();
  readonly refreshFailed = this.refreshFailedState.asReadonly();
  readonly loading = computed(() => this.current().status === 'loading');
  readonly empty = computed(() => this.current().status === 'empty');
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.reason : null;
  });
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((silent) =>
          silent
            ? this.fetch().pipe(
                switchMap((state) => {
                  if (state.status === 'error' && this.current().status === 'ready') {
                    this.refreshFailedState.set(true);
                    return NEVER_EMITS;
                  }
                  return of(state);
                }),
              )
            : this.fetch().pipe(startWith(LOADING)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.refreshFailedState.set(false);
        this.current.set(state);
      });
  }

  load(): void {
    this.loads.next(false);
  }

  reload(): void {
    this.loads.next(true);
  }

  private gated<T>(source: Observable<T>, priority: number): Observable<T> {
    return this.gate ? this.gate.run(source, priority) : source;
  }

  private fetch(): Observable<DashboardState> {
    return forkJoin({
      summary: settle(this.gated(this.gateway.getSummary(), -2)),
      upcoming: settle(this.gated(this.gateway.getUpcoming(), -1)),
    }).pipe(
      map(({ summary, upcoming }): DashboardState => {
        if (!summary.ok) return { status: 'error', reason: failureReason(summary.error) };
        if (!upcoming.ok) return { status: 'error', reason: failureReason(upcoming.error) };
        return summary.value.hasAccounts
          ? { status: 'ready', data: { summary: summary.value, upcoming: upcoming.value } }
          : EMPTY;
      }),
    );
  }
}
