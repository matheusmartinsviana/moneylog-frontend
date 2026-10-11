import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { GoalsGateway } from '~/modules/goals/core/interfaces/goals.gateway';
import type { Goal, ReservationInput } from '~/modules/goals/core/types/goal';
import { IdempotencyTracker, isAmbiguousFailure } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

interface Command {
  readonly goalId: string;
  readonly input: ReservationInput;
}

@Injectable()
export class GoalReserveFacade {
  private readonly gateway = inject(GoalsGateway);
  private readonly commands = new Subject<Command>();
  private readonly reservedEvents = new Subject<Goal>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<Command>();
  private last: Command | null = null;

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly canRetry = computed(() => isAmbiguousFailure(this.problemState()));
  readonly reserved$ = this.reservedEvents.asObservable();

  constructor() {
    this.commands
      .pipe(
        exhaustMap((command) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.gateway.reserve(command.goalId, command.input, this.keys.begin(command)).pipe(
            tap((goal) => {
              this.keys.succeeded();
              this.last = null;
              this.reservedEvents.next(goal);
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

  reserve(goalId: string, input: ReservationInput): void {
    this.last = { goalId, input };
    this.commands.next(this.last);
  }

  retry(): void {
    if (this.last) this.commands.next(this.last);
  }

  reopen(goalId: string): void {
    if (this.last?.goalId === goalId && isAmbiguousFailure(this.problemState())) return;
    this.last = null;
    this.problemState.set(null);
  }
}
