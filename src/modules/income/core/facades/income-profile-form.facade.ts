import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type {
  IncomeProfile,
  IncomeProfileInput,
  IncomeProfileUpdate,
} from '~/modules/income/core/types/income';
import { IdempotencyTracker, isAmbiguousFailure } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

type SaveRequest =
  | { readonly mode: 'create'; readonly input: IncomeProfileInput }
  | { readonly mode: 'update'; readonly id: string; readonly input: IncomeProfileUpdate };

@Injectable()
export class IncomeProfileFormFacade {
  private readonly gateway = inject(IncomeGateway);
  private readonly saves = new Subject<SaveRequest>();
  private readonly savedEvents = new Subject<IncomeProfile>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<IncomeProfileInput>();
  private last: SaveRequest | null = null;

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isAmbiguousFailure(this.problemState()));
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.saves
      .pipe(
        exhaustMap((request) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.run(request).pipe(
            tap((profile) => {
              this.last = null;
              if (request.mode === 'create') this.keys.succeeded();
              this.savedEvents.next(profile);
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

  create(input: IncomeProfileInput): void {
    this.submit({ mode: 'create', input });
  }

  update(id: string, input: IncomeProfileUpdate): void {
    this.submit({ mode: 'update', id, input });
  }

  retry(): void {
    if (this.last) this.saves.next(this.last);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  private submit(request: SaveRequest): void {
    this.last = request;
    this.saves.next(request);
  }

  private run(request: SaveRequest): Observable<IncomeProfile> {
    return request.mode === 'create'
      ? this.gateway.create(request.input, this.keys.begin(request.input))
      : this.gateway.update(request.id, request.input);
  }
}
