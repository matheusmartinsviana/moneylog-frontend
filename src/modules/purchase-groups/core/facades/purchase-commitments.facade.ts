import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import {
  commitmentUntil,
  DEFAULT_COMMITMENT_HORIZON,
  type PurchaseCommitments,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { Problem, problemOf } from '~/util/api/problem';
import { todayIso } from '~/util/date';

export type PurchaseCommitmentsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: PurchaseCommitments };

@Injectable()
export class PurchaseCommitmentsFacade {
  private readonly gateway = inject(PurchaseGroupsGateway);
  private readonly loads = new Subject<number>();
  private readonly current = signal<PurchaseCommitmentsState>({ status: 'loading' });
  private readonly horizonState = signal(DEFAULT_COMMITMENT_HORIZON);

  readonly state = this.current.asReadonly();
  readonly horizon = this.horizonState.asReadonly();
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
        switchMap((months) =>
          this.gateway.commitments(commitmentUntil(todayIso(), months)).pipe(
            map((data): PurchaseCommitmentsState => ({ status: 'ready', data })),
            startWith<PurchaseCommitmentsState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<PurchaseCommitmentsState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(months: number = this.horizonState()): void {
    this.horizonState.set(months);
    this.loads.next(months);
  }
}
