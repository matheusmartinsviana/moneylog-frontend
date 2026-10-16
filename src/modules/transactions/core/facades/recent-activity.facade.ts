import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { TransactionsGateway } from '~/modules/transactions/core/interfaces/transactions.gateway';
import { type ActivityItem, toActivityItem } from '~/modules/transactions/core/types/activity';
import { defaultFilters } from '~/modules/transactions/core/types/list-filters';
import { LEDGER_GATE } from '~/util/api/ledger-gate';
import { Problem, problemOf } from '~/util/api/problem';

export const RECENT_ACTIVITY_SIZE = 5;
const GATE_PRIORITY = 1;

export type RecentActivityState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly items: readonly ActivityItem[] };

const LOADING: RecentActivityState = { status: 'loading' };

@Injectable()
export class RecentActivityFacade {
  private readonly gateway = inject(TransactionsGateway);
  private readonly gate = inject(LEDGER_GATE, { optional: true });
  private readonly loads = new Subject<string>();
  private readonly current = signal<RecentActivityState>(LOADING);
  private lastAsOf: string | null = null;

  readonly state = this.current.asReadonly();
  readonly loading = computed(() => this.current().status === 'loading');
  readonly empty = computed(() => this.current().status === 'empty');
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly items = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.items : [];
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((asOf) =>
          this.gated(this.fetch(asOf)).pipe(
            map((items): RecentActivityState =>
              items.length === 0 ? { status: 'empty' } : { status: 'ready', items },
            ),
            startWith(LOADING),
            catchError((error: unknown) =>
              of<RecentActivityState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(asOf: string): void {
    this.lastAsOf = asOf;
    this.loads.next(asOf);
  }

  retry(): void {
    if (this.lastAsOf !== null) this.loads.next(this.lastAsOf);
  }

  private gated<T>(source: Observable<T>): Observable<T> {
    return this.gate ? this.gate.run(source, GATE_PRIORITY) : source;
  }

  private fetch(asOf: string): Observable<readonly ActivityItem[]> {
    const filters = { ...defaultFilters(asOf), from: null, to: asOf };
    return this.gateway
      .list(filters, 1, RECENT_ACTIVITY_SIZE)
      .pipe(map((slice) => slice.items.map((item) => toActivityItem(item, asOf))));
  }
}
