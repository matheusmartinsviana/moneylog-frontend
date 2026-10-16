import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { DebtsGateway } from '~/modules/debts/core/interfaces/debts.gateway';
import type { CardCashOutInput, Debt } from '~/modules/debts/core/types/debt';
import { IdempotencyTracker, isAmbiguousFailure } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

@Injectable()
export class CardCashOutFacade {
  private readonly gateway = inject(DebtsGateway);
  private readonly saves = new Subject<CardCashOutInput>();
  private readonly savedEvents = new Subject<Debt>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<CardCashOutInput>();
  private last: CardCashOutInput | null = null;

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
          return this.gateway.createCardCashOut(input, this.keys.begin(input)).pipe(
            tap((debt) => {
              this.last = null;
              this.keys.succeeded();
              this.savedEvents.next(debt);
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

  save(input: CardCashOutInput): void {
    this.last = input;
    this.saves.next(input);
  }

  retry(): void {
    if (this.last) this.saves.next(this.last);
  }
}
