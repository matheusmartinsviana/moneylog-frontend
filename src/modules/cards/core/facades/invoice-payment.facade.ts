import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { DebouncedPreview } from '~/modules/cards/core/facades/debounced-preview';
import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import type {
  Invoice,
  InvoicePaymentInput,
  PaymentPreview,
} from '~/modules/cards/core/types/invoice';
import { newIdempotencyKey } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

interface Attempt {
  readonly invoiceId: string;
  readonly input: InvoicePaymentInput;
  readonly key: string;
}

interface PreviewKey {
  readonly invoiceId: string;
  readonly amount: string;
}

export function isRetryablePayment(problem: Problem | null): boolean {
  return (
    problem !== null &&
    (problem.status === 0 || problem.status >= 500 || problem.code === 'CONFLICT')
  );
}

@Injectable()
export class InvoicePaymentFacade {
  private readonly gateway = inject(CardsGateway);
  private readonly attempts = new Subject<Attempt>();
  private readonly paidEvents = new Subject<Invoice>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private last: Attempt | null = null;
  private readonly preview = new DebouncedPreview<PreviewKey, PaymentPreview>((key) =>
    this.gateway.previewPayment(key.invoiceId, key.amount),
  );

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isRetryablePayment(this.problemState()));
  readonly paid$ = this.paidEvents.asObservable();

  readonly previewState = this.preview.state;
  readonly previewData = this.preview.data;
  readonly previewLoading = this.preview.loading;

  constructor() {
    this.attempts
      .pipe(
        exhaustMap((attempt) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.send(attempt).pipe(
            tap((invoice) => {
              this.last = null;
              this.paidEvents.next(invoice);
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        if (!isRetryablePayment(problem)) this.last = null;
        this.problemState.set(problem);
      });
  }

  pay(invoiceId: string, input: InvoicePaymentInput): void {
    const pending = this.last;
    const same =
      pending !== null &&
      pending.invoiceId === invoiceId &&
      pending.input.accountId === input.accountId &&
      pending.input.amount === input.amount &&
      pending.input.date === input.date;
    const attempt: Attempt = {
      invoiceId,
      input,
      key: same ? pending.key : newIdempotencyKey(),
    };
    this.last = attempt;
    this.attempts.next(attempt);
  }

  retry(): void {
    if (this.last) this.attempts.next(this.last);
  }

  reopen(invoiceId: string): void {
    if (this.last?.invoiceId === invoiceId && isRetryablePayment(this.problemState())) return;
    this.last = null;
    this.problemState.set(null);
  }

  requestPreview(invoiceId: string, amount: string | null): void {
    this.preview.request(amount === null ? null : { invoiceId, amount });
  }

  private send({ invoiceId, input, key }: Attempt): Observable<Invoice> {
    return this.gateway.payInvoice(invoiceId, input, key);
  }
}
