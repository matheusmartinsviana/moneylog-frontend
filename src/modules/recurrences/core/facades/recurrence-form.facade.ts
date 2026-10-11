import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  exhaustMap,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { RecurrencesGateway } from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import type {
  Recurrence,
  RecurrenceInput,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import { IdempotencyTracker } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

export type SaveRecurrence =
  | { readonly kind: 'create'; readonly input: RecurrenceInput }
  | { readonly kind: 'update'; readonly id: string; readonly input: RecurrenceUpdate };

export type RecurrenceLoadState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly recurrence: Recurrence };

@Injectable()
export class RecurrenceFormFacade {
  private readonly gateway = inject(RecurrencesGateway);
  private readonly saves = new Subject<SaveRecurrence>();
  private readonly loads = new Subject<string>();
  private readonly savedEvents = new Subject<Recurrence>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly loadState = signal<RecurrenceLoadState>({ status: 'idle' });
  private readonly loaded = signal<Recurrence | null>(null);
  private readonly keys = new IdempotencyTracker<RecurrenceInput>();

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly loadStatus = this.loadState.asReadonly();
  readonly recurrence = this.loaded.asReadonly();
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.saves
      .pipe(
        exhaustMap((command) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.send(command).pipe(
            tap((recurrence) => {
              this.keys.succeeded();
              this.savedEvents.next(recurrence);
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

    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((recurrence): RecurrenceLoadState => ({ status: 'ready', recurrence })),
            startWith<RecurrenceLoadState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<RecurrenceLoadState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.loadState.set(state);
        if (state.status === 'ready') this.loaded.set(state.recurrence);
        else if (state.status === 'error') this.loaded.set(null);
      });
  }

  load(id: string): void {
    this.loads.next(id);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  save(command: SaveRecurrence): void {
    this.saves.next(command);
  }

  private send(command: SaveRecurrence): Observable<Recurrence> {
    return command.kind === 'create'
      ? this.gateway.create(command.input, this.keys.begin(command.input))
      : this.gateway.update(command.id, command.input);
  }
}
