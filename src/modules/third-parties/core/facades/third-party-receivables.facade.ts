import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { ThirdPartiesGateway } from '~/modules/third-parties/core/interfaces/third-parties.gateway';
import type { ThirdPartyReceivables } from '~/modules/third-parties/core/types/third-party';
import { Problem, problemOf } from '~/util/api/problem';

export type ThirdPartyReceivablesState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly data: ThirdPartyReceivables }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: ThirdPartyReceivables };

@Injectable()
export class ThirdPartyReceivablesFacade {
  private readonly gateway = inject(ThirdPartiesGateway);
  private readonly loads = new Subject<string | null>();
  private readonly current = signal<ThirdPartyReceivablesState>({ status: 'loading' });
  private readonly monthState = signal<string | null>(null);

  readonly state = this.current.asReadonly();
  readonly month = this.monthState.asReadonly();
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' || state.status === 'empty' ? state.data : null;
  });
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((month) =>
          this.gateway.receivables(month).pipe(
            map((data): ThirdPartyReceivablesState => ({
              status:
                data.people.length === 0 && isZero(data.month.grossConsumption.amount)
                  ? 'empty'
                  : 'ready',
              data,
            })),
            startWith<ThirdPartyReceivablesState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<ThirdPartyReceivablesState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(month: string | null = this.monthState()): void {
    this.monthState.set(month);
    this.loads.next(month);
  }
}

function isZero(amount: string): boolean {
  return /^-?0+(?:\.0+)?$/.test(amount);
}
