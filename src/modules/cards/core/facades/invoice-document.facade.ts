import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import type { Invoice } from '~/modules/cards/core/types/invoice';
import { Problem, problemOf } from '~/util/api/problem';

interface Change {
  readonly invoiceId: string;
  readonly documentAmount: string | null;
  readonly version: number | null;
}

@Injectable()
export class InvoiceDocumentFacade {
  private readonly gateway = inject(CardsGateway);
  private readonly changes = new Subject<Change>();
  private readonly savedEvents = new Subject<Invoice>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.changes
      .pipe(
        exhaustMap((change) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.send(change).pipe(
            tap((invoice) => this.savedEvents.next(invoice)),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        this.problemState.set(problem);
      });
  }

  save(invoiceId: string, documentAmount: string | null, version: number | null): void {
    this.changes.next({ invoiceId, documentAmount, version });
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  private send({ invoiceId, documentAmount, version }: Change): Observable<Invoice> {
    return this.gateway.changeDocumentAmount(invoiceId, documentAmount, version);
  }
}
