import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { OwnerStatementGateway } from '~/modules/owner-statement/core/interfaces/owner-statement.gateway';
import type {
  OwnerStatement,
  OwnerStatementQuery,
} from '~/modules/owner-statement/core/types/owner-statement';
import { LEDGER_GATE } from '~/util/api/ledger-gate';
import { Problem, problemOf } from '~/util/api/problem';

export type OwnerStatementState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: OwnerStatement };

const PRIORITY = 0;

@Injectable()
export class OwnerStatementFacade {
  private readonly gateway = inject(OwnerStatementGateway);
  private readonly gate = inject(LEDGER_GATE, { optional: true });
  private readonly loads = new Subject<OwnerStatementQuery>();
  private readonly current = signal<OwnerStatementState>({ status: 'loading' });

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
        switchMap((query) =>
          (this.gate
            ? this.gate.run(this.gateway.get(query), PRIORITY)
            : this.gateway.get(query)
          ).pipe(
            map((data): OwnerStatementState => ({ status: 'ready', data })),
            startWith<OwnerStatementState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<OwnerStatementState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(query: OwnerStatementQuery): void {
    this.loads.next(query);
  }
}
