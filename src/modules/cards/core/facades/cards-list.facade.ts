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
  tap,
} from 'rxjs';

import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import type { Card, CardStatus } from '~/modules/cards/core/types/card';
import { LEDGER_GATE } from '~/util/api/ledger-gate';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type CardsListState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly Card[] };

const LOADING: CardsListState = { status: 'loading' };

@Injectable()
export class CardsListFacade {
  private readonly gateway = inject(CardsGateway);
  private readonly gate = inject(LEDGER_GATE, { optional: true });
  private readonly loads = new Subject<CardStatus | undefined>();
  private readonly current = signal<CardsListState>(LOADING);
  private filter: CardStatus | undefined;

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
            map((data): CardsListState =>
              data.length === 0 ? { status: 'empty' } : { status: 'ready', data },
            ),
            startWith(LOADING),
            catchError((error: unknown) =>
              of<CardsListState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  private gated<T>(source: Observable<T>): Observable<T> {
    return this.gate ? this.gate.run(source, 6) : source;
  }

  load(status: CardStatus = 'ACTIVE'): void {
    this.filter = status;
    this.loads.next(status);
  }

  loadAll(status: CardStatus = 'ACTIVE'): Observable<readonly Card[]> {
    const page = (n: number) => this.gateway.list({ status, page: n, pageSize: MAX_PAGE_SIZE });
    return page(1).pipe(
      expand((slice, index) => (slice.hasNext ? page(index + 2) : EMPTY)),
      reduce((all: readonly Card[], slice) => [...all, ...slice.items], [] as readonly Card[]),
    );
  }

  archive(id: string): Observable<Card> {
    return this.gateway.archive(id).pipe(tap((card) => this.replace(card)));
  }

  unarchive(id: string): Observable<Card> {
    return this.gateway.unarchive(id).pipe(tap((card) => this.replace(card)));
  }

  private replace(card: Card): void {
    const state = this.current();
    if (state.status !== 'ready') return;
    const data = state.data
      .map((item) => (item.id === card.id ? card : item))
      .filter((item) => this.filter === undefined || item.status === this.filter);
    this.current.set(data.length === 0 ? { status: 'empty' } : { status: 'ready', data });
  }
}
