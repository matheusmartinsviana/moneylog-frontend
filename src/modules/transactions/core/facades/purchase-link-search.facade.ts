import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  timer,
} from 'rxjs';

import { SEARCH_DEBOUNCE_MS } from '~/modules/transactions/core/facades/transactions-list.facade';
import { TransactionsGateway } from '~/modules/transactions/core/interfaces/transactions.gateway';
import {
  defaultFilters,
  firstDayMonthsBefore,
  monthBounds,
} from '~/modules/transactions/core/types/list-filters';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import { Problem, problemOf } from '~/util/api/problem';
import { todayIso } from '~/util/date';
import { cleanSearchTerm } from '~/util/search-term';

export const PURCHASE_LINK_SEARCH_MONTHS = 36;
export const PURCHASE_LINK_SEARCH_PAGE_SIZE = 20;

type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'searching' }
  | { readonly status: 'done'; readonly items: readonly Transaction[] }
  | { readonly status: 'error'; readonly problem: Problem };

@Injectable()
export class PurchaseLinkSearchFacade {
  private readonly gateway = inject(TransactionsGateway);
  private readonly terms = new Subject<string>();
  private readonly retries = new Subject<string>();
  private lastTerm = '';
  private readonly current = signal<SearchState>({ status: 'idle' });

  readonly results = computed<readonly Transaction[] | null>(() => {
    const state = this.current();
    return state.status === 'done' ? state.items : null;
  });
  readonly problem = computed<Problem | null>(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly searching = computed(() => this.current().status === 'searching');

  constructor() {
    merge(
      this.terms.pipe(
        map((term) => cleanSearchTerm(term).trim()),
        distinctUntilChanged(),
        switchMap((term) =>
          term === ''
            ? of<SearchState>({ status: 'idle' })
            : timer(SEARCH_DEBOUNCE_MS).pipe(switchMap(() => this.run(term))),
        ),
      ),
      this.retries.pipe(switchMap((term) => this.run(term))),
    )
      .pipe(takeUntilDestroyed())
      .subscribe((state) => this.current.set(state));
  }

  search(term: string): void {
    this.lastTerm = cleanSearchTerm(term).trim();
    this.terms.next(term);
  }

  retry(): void {
    if (this.lastTerm !== '') this.retries.next(this.lastTerm);
  }

  private run(term: string): Observable<SearchState> {
    const today = todayIso();
    const filters = {
      ...defaultFilters(today),
      type: 'CARD_PURCHASE' as const,
      q: term,
      from: firstDayMonthsBefore(today, PURCHASE_LINK_SEARCH_MONTHS),
      to: monthBounds(today).to,
    };
    return this.gateway.list(filters, 1, PURCHASE_LINK_SEARCH_PAGE_SIZE).pipe(
      map((slice): SearchState => ({
        status: 'done',
        items: slice.items.filter((item) => item.installments.length > 1),
      })),
      startWith<SearchState>({ status: 'searching' }),
      catchError((error: unknown) =>
        of<SearchState>({ status: 'error', problem: problemOf(error) }),
      ),
    );
  }
}
