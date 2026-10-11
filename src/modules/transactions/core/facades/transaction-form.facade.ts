import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { TransactionsEvents } from '~/modules/transactions/core/facades/transactions-events';
import { TransactionsGateway } from '~/modules/transactions/core/interfaces/transactions.gateway';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import type { TransactionInput } from '~/modules/transactions/core/types/transaction-input';
import { newIdempotencyKey } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

export type SaveTransaction =
  | { readonly kind: 'create'; readonly input: TransactionInput }
  | {
      readonly kind: 'update';
      readonly id: string;
      readonly input: TransactionInput;
      readonly version: number;
    };

interface Attempt {
  readonly command: SaveTransaction;
  readonly key: string | null;
}

export function isRetryable(problem: Problem | null): boolean {
  return (
    problem !== null &&
    (problem.status === 0 || problem.status >= 500 || problem.code === 'CONFLICT')
  );
}

@Injectable()
export class TransactionFormFacade {
  private readonly gateway = inject(TransactionsGateway);
  private readonly events = inject(TransactionsEvents);
  private readonly attempts = new Subject<Attempt>();
  private readonly savedEvents = new Subject<Transaction>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private last: Attempt | null = null;
  private pending: Attempt | null = null;

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isRetryable(this.problemState()));
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.attempts
      .pipe(
        exhaustMap((attempt) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.send(attempt).pipe(
            tap((transaction) => {
              this.last = null;
              this.pending = null;
              this.savedEvents.next(transaction);
              this.events.notifyChanged();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        this.pending = isRetryable(problem) ? this.last : null;
        this.problemState.set(problem);
      });
  }

  submit(command: SaveTransaction): void {
    const pending = this.pending;
    const reuse =
      command.kind === 'create' &&
      pending !== null &&
      pending.key !== null &&
      pending.command.kind === 'create' &&
      JSON.stringify(pending.command.input) === JSON.stringify(command.input);
    const attempt: Attempt = {
      command,
      key: command.kind === 'create' ? (reuse ? pending.key : newIdempotencyKey()) : null,
    };
    this.last = attempt;
    this.attempts.next(attempt);
  }

  dismissProblem(): void {
    this.last = null;
    this.problemState.set(null);
  }

  retry(): void {
    if (this.last) this.attempts.next(this.last);
  }

  private send({ command, key }: Attempt): Observable<Transaction> {
    return command.kind === 'create'
      ? this.gateway.create(command.input, key ?? newIdempotencyKey())
      : this.gateway.update(command.id, command.input, command.version);
  }
}
