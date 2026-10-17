import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { NetWorthGateway } from '~/modules/net-worth/core/interfaces/net-worth.gateway';
import type { NetWorthOverview } from '~/modules/net-worth/core/types/net-worth';
import { Problem, problemOf } from '~/util/api/problem';

export type NetWorthState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: NetWorthOverview };

@Injectable()
export class NetWorthFacade {
  private readonly gateway = inject(NetWorthGateway);
  private readonly loads = new Subject<number | null>();
  private readonly current = signal<NetWorthState>({ status: 'loading' });
  private readonly targetState = signal<number | null>(null);

  readonly state = this.current.asReadonly();
  readonly targetMonths = this.targetState.asReadonly();
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
        switchMap((target) =>
          this.gateway.overview(target).pipe(
            map((data): NetWorthState => ({ status: 'ready', data })),
            startWith<NetWorthState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<NetWorthState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(): void {
    this.loads.next(this.targetState());
  }

  setTarget(months: number | null): void {
    this.targetState.set(months);
    this.loads.next(months);
  }
}
