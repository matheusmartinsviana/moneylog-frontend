import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import type {
  PurchaseGroup,
  PurchaseGroupInput,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { IdempotencyTracker, isAmbiguousFailure } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

@Injectable()
export class PurchaseGroupFormFacade {
  private readonly gateway = inject(PurchaseGroupsGateway);
  private readonly saves = new Subject<PurchaseGroupInput>();
  private readonly savedEvents = new Subject<PurchaseGroup>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<PurchaseGroupInput>();
  private last: PurchaseGroupInput | null = null;

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isAmbiguousFailure(this.problemState()));
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.saves
      .pipe(
        exhaustMap((input) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.gateway.create(input, this.keys.begin(input)).pipe(
            tap((group) => {
              this.last = null;
              this.keys.succeeded();
              this.savedEvents.next(group);
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        if (problem !== null) this.keys.failed(problem);
        this.problemState.set(problem);
      });
  }

  save(input: PurchaseGroupInput): void {
    this.last = input;
    this.saves.next(input);
  }

  retry(): void {
    if (this.last) this.saves.next(this.last);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }
}
