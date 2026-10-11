import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  map,
  merge,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  timer,
} from 'rxjs';

import { SearchGateway } from '~/modules/search/core/interfaces/search.gateway';
import { SEARCH_GROUPS, type SearchResults } from '~/modules/search/core/types/search';
import { Problem, problemOf } from '~/util/api/problem';
import { searchQueryOf } from '~/util/search-term';

export const GLOBAL_SEARCH_DEBOUNCE_MS = 300;

export type SearchFailureKind = 'invalid' | 'rateLimit' | 'generic';

export type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly q: string }
  | { readonly status: 'error'; readonly kind: SearchFailureKind; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: SearchResults };

const IDLE: SearchState = { status: 'idle' };

function failureKind(problem: Problem): SearchFailureKind {
  if (problem.status === 429) return 'rateLimit';
  if (problem.code === 'SEARCH_QUERY_INVALID') return 'invalid';
  return 'generic';
}

function isEmpty(data: SearchResults): boolean {
  return SEARCH_GROUPS.every((group) => data[group].length === 0);
}

@Injectable()
export class SearchFacade {
  private readonly gateway = inject(SearchGateway);
  private readonly typed = new Subject<string>();
  private readonly retries = new Subject<string>();
  private readonly current = signal<SearchState>(IDLE);
  private lastQuery: string | null = null;

  readonly state = this.current.asReadonly();
  readonly query = signal<string | null>(null);
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });

  constructor() {
    const debounced = this.typed.pipe(
      map((text) => searchQueryOf(text)),
      switchMap((q) =>
        q === null ? of(null) : timer(GLOBAL_SEARCH_DEBOUNCE_MS).pipe(map(() => q)),
      ),
      filter((q) => q === null || !this.showing(q)),
    );
    merge(debounced, this.retries)
      .pipe(
        switchMap((q) => this.fetch(q)),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  type(text: string): void {
    const q = searchQueryOf(text);
    this.lastQuery = q;
    this.query.set(q);
    if (q === null) this.current.set(IDLE);
    else if (!this.showing(q)) {
      this.current.set({ status: 'loading' });
    }
    this.typed.next(text);
  }

  retry(): void {
    if (this.lastQuery !== null) this.retries.next(this.lastQuery);
  }

  clear(): void {
    this.type('');
  }

  private showing(q: string): boolean {
    const state = this.current();
    if (state.status === 'ready') return state.data.q === q;
    return state.status === 'empty' && state.q === q;
  }

  private fetch(q: string | null): Observable<SearchState> {
    if (q === null) return of(IDLE);
    return this.gateway.search(q).pipe(
      map((data): SearchState =>
        isEmpty(data) ? { status: 'empty', q } : { status: 'ready', data },
      ),
      startWith<SearchState>({ status: 'loading' }),
      catchError((error: unknown) => {
        const problem = problemOf(error);
        return of<SearchState>({ status: 'error', kind: failureKind(problem), problem });
      }),
    );
  }
}
