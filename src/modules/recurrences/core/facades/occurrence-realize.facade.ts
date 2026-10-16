import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { RecurrencesGateway } from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import type {
  RealizedTransaction,
  RealizePayment,
} from '~/modules/recurrences/core/types/recurrence';
import type { RealizeForeign } from '~/modules/recurrences/core/types/subscription';
import { newIdempotencyKey } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

interface Attempt {
  readonly recurrenceId: string;
  readonly date: string;
  readonly amount: string | null;
  readonly payment: RealizePayment | null;
  readonly foreign: RealizeForeign | null;
  readonly key: string;
}

export function isRetryableRealize(problem: Problem | null): boolean {
  return (
    problem !== null &&
    (problem.status === 0 || problem.status >= 500 || problem.code === 'CONFLICT')
  );
}

@Injectable()
export class OccurrenceRealizeFacade {
  private readonly gateway = inject(RecurrencesGateway);
  private readonly attempts = new Subject<Attempt>();
  private readonly realizedEvents = new Subject<RealizedTransaction>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private last: Attempt | null = null;

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isRetryableRealize(this.problemState()));
  readonly realized$ = this.realizedEvents.asObservable();

  constructor() {
    this.attempts
      .pipe(
        exhaustMap((attempt) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.gateway
            .realize(
              attempt.recurrenceId,
              attempt.date,
              attempt.amount,
              attempt.key,
              attempt.payment,
              attempt.foreign,
            )
            .pipe(
              tap((transaction) => {
                this.last = null;
                this.realizedEvents.next(transaction);
              }),
              map(() => null),
              catchError((error: unknown) => of(problemOf(error))),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        if (!isRetryableRealize(problem)) this.last = null;
        this.problemState.set(problem);
      });
  }

  realize(
    recurrenceId: string,
    date: string,
    amount: string | null,
    payment: RealizePayment | null = null,
    foreign: RealizeForeign | null = null,
  ): void {
    const pending = this.last;
    const same =
      pending !== null &&
      pending.recurrenceId === recurrenceId &&
      pending.date === date &&
      pending.amount === amount &&
      pending.payment?.accountId === payment?.accountId &&
      pending.payment?.method === payment?.method &&
      pending.foreign?.originalAmount === foreign?.originalAmount &&
      pending.foreign?.currency === foreign?.currency &&
      pending.foreign?.fxRate === foreign?.fxRate &&
      pending.foreign?.iofBps === foreign?.iofBps;
    const attempt: Attempt = {
      recurrenceId,
      date,
      amount,
      payment,
      foreign,
      key: same ? pending.key : newIdempotencyKey(),
    };
    this.last = attempt;
    this.attempts.next(attempt);
  }

  retry(): void {
    if (this.last) this.attempts.next(this.last);
  }

  reopen(recurrenceId: string, date: string): void {
    if (
      this.last?.recurrenceId === recurrenceId &&
      this.last.date === date &&
      isRetryableRealize(this.problemState())
    ) {
      return;
    }
    this.last = null;
    this.problemState.set(null);
  }
}
