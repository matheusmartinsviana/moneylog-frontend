import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  expand,
  map,
  Observable,
  of,
  reduce,
  startWith,
  Subject,
  switchMap,
  tap,
  EMPTY,
} from 'rxjs';

import { AccountsGateway } from '~/modules/accounts/core/interfaces/accounts.gateway';
import type { Account, AccountStatus } from '~/modules/accounts/core/types/account';
import { LEDGER_GATE } from '~/util/api/ledger-gate';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type AccountsListState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly Account[] };

const LOADING: AccountsListState = { status: 'loading' };

@Injectable()
export class AccountsListFacade {
  private readonly gateway = inject(AccountsGateway);
  private readonly gate = inject(LEDGER_GATE, { optional: true });
  private readonly loads = new Subject<AccountStatus | undefined>();
  private readonly current = signal<AccountsListState>(LOADING);
  private filter: AccountStatus | undefined;

  readonly state = this.current.asReadonly();
  readonly loading = computed(() => this.current().status === 'loading');
  readonly empty = computed(() => this.current().status === 'empty');
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((status) =>
          this.gated(this.loadAll(status)).pipe(
            map((data): AccountsListState =>
              data.length === 0 ? { status: 'empty' } : { status: 'ready', data },
            ),
            startWith(LOADING),
            catchError((error: unknown) =>
              of<AccountsListState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  private gated<T>(source: Observable<T>): Observable<T> {
    return this.gate ? this.gate.run(source, 5) : source;
  }

  load(status?: AccountStatus): void {
    this.filter = status;
    this.loads.next(status);
  }

  loadAll(status?: AccountStatus): Observable<readonly Account[]> {
    const page = (n: number) => this.gateway.list({ status, page: n, pageSize: MAX_PAGE_SIZE });
    return page(1).pipe(
      expand((slice, index) => (slice.hasNext ? page(index + 2) : EMPTY)),
      reduce(
        (all: readonly Account[], slice) => [...all, ...slice.items],
        [] as readonly Account[],
      ),
    );
  }

  archive(id: string): Observable<Account> {
    return this.gateway.archive(id).pipe(tap((account) => this.replace(account)));
  }

  unarchive(id: string): Observable<Account> {
    return this.gateway.unarchive(id).pipe(tap((account) => this.replace(account)));
  }

  private replace(account: Account): void {
    const state = this.current();
    if (state.status !== 'ready') return;
    const data = state.data
      .map((item) => (item.id === account.id ? account : item))
      .filter((item) => this.filter === undefined || item.status === this.filter);
    this.current.set(data.length === 0 ? { status: 'empty' } : { status: 'ready', data });
  }
}
