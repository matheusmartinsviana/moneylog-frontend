import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  expand,
  map,
  Observable,
  of,
  reduce,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import type {
  PurchaseGroup,
  PurchaseGroupStatus,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type PurchaseGroupsListState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly PurchaseGroup[] };

const LOADING: PurchaseGroupsListState = { status: 'loading' };

@Injectable()
export class PurchaseGroupsListFacade {
  private readonly gateway = inject(PurchaseGroupsGateway);
  private readonly loads = new Subject<PurchaseGroupStatus>();
  private readonly current = signal<PurchaseGroupsListState>(LOADING);
  private readonly statusState = signal<PurchaseGroupStatus>('ACTIVE');

  readonly state = this.current.asReadonly();
  readonly filter = this.statusState.asReadonly();
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((status) =>
          this.loadAll(status).pipe(
            map((data): PurchaseGroupsListState =>
              data.length === 0 ? { status: 'empty' } : { status: 'ready', data },
            ),
            startWith(LOADING),
            catchError((error: unknown) =>
              of<PurchaseGroupsListState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(status: PurchaseGroupStatus = this.statusState()): void {
    this.statusState.set(status);
    this.loads.next(status);
  }

  reload(): void {
    this.loads.next(this.statusState());
  }

  private loadAll(status: PurchaseGroupStatus): Observable<readonly PurchaseGroup[]> {
    const page = (n: number) => this.gateway.list(status, n, MAX_PAGE_SIZE);
    return page(1).pipe(
      expand((slice, index) => (slice.hasNext ? page(index + 2) : EMPTY)),
      reduce(
        (all: readonly PurchaseGroup[], slice) => [...all, ...slice.items],
        [] as readonly PurchaseGroup[],
      ),
    );
  }
}
