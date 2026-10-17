import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, Subject, tap } from 'rxjs';

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import type {
  Asset,
  AssetBalanceInput,
  AssetInput,
  AssetUpdate,
} from '~/modules/assets/core/types/asset';
import { IdempotencyTracker, isAmbiguousFailure } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

type SaveRequest =
  | { readonly mode: 'create'; readonly input: AssetInput }
  | { readonly mode: 'update'; readonly id: string; readonly input: AssetUpdate }
  | { readonly mode: 'balance'; readonly id: string; readonly input: AssetBalanceInput };

@Injectable()
export class AssetFormFacade {
  private readonly gateway = inject(AssetsGateway);
  private readonly saves = new Subject<SaveRequest>();
  private readonly savedEvents = new Subject<Asset>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<AssetInput>();
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
            tap((asset) => {
              this.last = null;
              if (request.mode === 'create') this.keys.succeeded();
              this.savedEvents.next(asset);
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

  create(input: AssetInput): void {
    this.submit({ mode: 'create', input });
  }

  update(id: string, input: AssetUpdate): void {
    this.submit({ mode: 'update', id, input });
  }

  updateBalance(id: string, input: AssetBalanceInput): void {
    this.submit({ mode: 'balance', id, input });
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

  private run(request: SaveRequest): Observable<Asset> {
    switch (request.mode) {
      case 'create':
        return this.gateway.create(request.input, this.keys.begin(request.input));
      case 'update':
        return this.gateway.update(request.id, request.input);
      case 'balance':
        return this.gateway.updateBalance(request.id, request.input);
    }
  }
}
