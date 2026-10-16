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

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import type { Asset, AssetStatus } from '~/modules/assets/core/types/asset';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type AssetsListState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly Asset[] };

const LOADING: AssetsListState = { status: 'loading' };

@Injectable()
export class AssetsListFacade {
  private readonly gateway = inject(AssetsGateway);
  private readonly loads = new Subject<AssetStatus>();
  private readonly archives = new Subject<string>();
  private readonly archivedEvents = new Subject<Asset>();
  private readonly current = signal<AssetsListState>(LOADING);
  private readonly statusState = signal<AssetStatus>('ACTIVE');
  private readonly archivingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);

  readonly state = this.current.asReadonly();
  readonly filter = this.statusState.asReadonly();
  readonly archiving = this.archivingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly archived$ = this.archivedEvents.asObservable();
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
            map((data): AssetsListState =>
              data.length === 0 ? { status: 'empty' } : { status: 'ready', data },
            ),
            startWith(LOADING),
            catchError((error: unknown) =>
              of<AssetsListState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));

    this.archives
      .pipe(
        exhaustMap((id) => {
          this.archivingState.set(true);
          this.problemState.set(null);
          return this.gateway.archive(id).pipe(
            tap((asset) => this.archivedEvents.next(asset)),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.archivingState.set(false);
        this.problemState.set(problem);
      });
  }

  load(status: AssetStatus = this.statusState()): void {
    this.statusState.set(status);
    this.loads.next(status);
  }

  reload(): void {
    this.loads.next(this.statusState());
  }

  archive(id: string): void {
    this.archives.next(id);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  private loadAll(status: AssetStatus): Observable<readonly Asset[]> {
    const page = (n: number) => this.gateway.list(status, n, MAX_PAGE_SIZE);
    return page(1).pipe(
      expand((slice, index) => (slice.hasNext ? page(index + 2) : EMPTY)),
      reduce((all: readonly Asset[], slice) => [...all, ...slice.items], [] as readonly Asset[]),
    );
  }
}
