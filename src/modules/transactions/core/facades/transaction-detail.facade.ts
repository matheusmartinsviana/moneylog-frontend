import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { TransactionsEvents } from '~/modules/transactions/core/facades/transactions-events';
import { TransactionsGateway } from '~/modules/transactions/core/interfaces/transactions.gateway';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import { Problem, problemOf } from '~/util/api/problem';
import type { SplitInput } from '~/util/split';

export type DetailState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'notFound' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly transaction: Transaction };

@Injectable()
export class TransactionDetailFacade {
  private readonly gateway = inject(TransactionsGateway);
  private readonly events = inject(TransactionsEvents);
  private readonly loads = new Subject<string>();
  private readonly voids = new Subject<{ id: string; reason: string }>();
  private readonly voidedEvents = new Subject<Transaction>();
  private readonly current = signal<DetailState>({ status: 'idle' });
  private readonly voidingState = signal(false);
  private readonly voidProblemState = signal<Problem | null>(null);
  private readonly cancels = new Subject<{ id: string; reason: string }>();
  private readonly canceledEvents = new Subject<Transaction>();
  private readonly cancelingState = signal(false);
  private readonly cancelProblemState = signal<Problem | null>(null);
  private readonly shareUpdates = new Subject<{
    id: string;
    split: SplitInput;
    version: number;
  }>();
  private readonly sharesUpdatedEvents = new Subject<Transaction>();
  private readonly sharesSavingState = signal(false);
  private readonly sharesProblemState = signal<Problem | null>(null);

  readonly state = this.current.asReadonly();
  readonly transaction = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.transaction : null;
  });
  readonly voided$ = this.voidedEvents.asObservable();
  readonly voiding = this.voidingState.asReadonly();
  readonly voidProblem = this.voidProblemState.asReadonly();
  readonly canceled$ = this.canceledEvents.asObservable();
  readonly canceling = this.cancelingState.asReadonly();
  readonly cancelProblem = this.cancelProblemState.asReadonly();

  readonly sharesUpdated$ = this.sharesUpdatedEvents.asObservable();
  readonly sharesSaving = this.sharesSavingState.asReadonly();
  readonly sharesProblem = this.sharesProblemState.asReadonly();

  readonly voidBlockedBy = computed(() => this.transaction()?.voidBlockedBy ?? null);
  readonly canCancelInstallments = computed(() => {
    const tx = this.transaction();
    return (
      tx !== null &&
      tx.type === 'CARD_PURCHASE' &&
      tx.status === 'ACTIVE' &&
      tx.voidBlockedBy === 'TRANSACTION_IN_CLOSED_INVOICE'
    );
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((transaction): DetailState => ({ status: 'ready', transaction })),
            startWith<DetailState>({ status: 'loading' }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              return of<DetailState>(
                problem.status === 404 ? { status: 'notFound' } : { status: 'error', problem },
              );
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));

    this.voids
      .pipe(
        exhaustMap(({ id, reason }) => {
          this.voidingState.set(true);
          this.voidProblemState.set(null);
          return this.gateway.void(id, reason.trim()).pipe(
            tap((transaction) => {
              this.current.set({ status: 'ready', transaction });
              this.voidedEvents.next(transaction);
              this.events.notifyChanged();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.voidingState.set(false);
        this.voidProblemState.set(problem);
      });

    this.cancels
      .pipe(
        exhaustMap(({ id, reason }) => {
          this.cancelingState.set(true);
          this.cancelProblemState.set(null);
          return this.gateway.cancelInstallments(id, reason.trim()).pipe(
            tap((transaction) => {
              this.current.set({ status: 'ready', transaction });
              this.canceledEvents.next(transaction);
              this.events.notifyChanged();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.cancelingState.set(false);
        this.cancelProblemState.set(problem);
      });

    this.shareUpdates
      .pipe(
        exhaustMap(({ id, split, version }) => {
          this.sharesSavingState.set(true);
          this.sharesProblemState.set(null);
          return this.gateway.updateShares(id, split, version).pipe(
            tap((transaction) => {
              this.current.set({ status: 'ready', transaction });
              this.sharesUpdatedEvents.next(transaction);
              this.events.notifyChanged();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.sharesSavingState.set(false);
        this.sharesProblemState.set(problem);
      });
  }

  load(id: string): void {
    this.loads.next(id);
  }

  voidTransaction(id: string, reason: string): void {
    this.voids.next({ id, reason });
  }

  cancelInstallments(id: string, reason: string): void {
    this.cancels.next({ id, reason });
  }

  updateShares(id: string, split: SplitInput, version: number): void {
    this.shareUpdates.next({ id, split, version });
  }

  clearSharesProblem(): void {
    this.sharesProblemState.set(null);
  }
}
