import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type { TaxTable } from '~/modules/income/core/types/income';
import { Problem, problemOf } from '~/util/api/problem';

export type TaxTablesState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly TaxTable[] };

@Injectable()
export class TaxTablesFacade {
  private readonly gateway = inject(IncomeGateway);
  private readonly loads = new Subject<number>();
  private readonly current = signal<TaxTablesState>({ status: 'idle' });

  readonly state = this.current.asReadonly();
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
        switchMap((year) =>
          this.gateway.taxTables(year).pipe(
            map((data): TaxTablesState =>
              data.length === 0 ? { status: 'unavailable' } : { status: 'ready', data },
            ),
            startWith<TaxTablesState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<TaxTablesState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(year: number): void {
    this.loads.next(year);
  }
}
