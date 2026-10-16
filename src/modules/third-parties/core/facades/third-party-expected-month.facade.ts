import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { ThirdPartiesGateway } from '~/modules/third-parties/core/interfaces/third-parties.gateway';
import type {
  ThirdPartyExpectedMonth,
  ThirdPartyExpectedMonthInput,
} from '~/modules/third-parties/core/types/third-party';
import { Problem, problemOf } from '~/util/api/problem';

@Injectable()
export class ThirdPartyExpectedMonthFacade {
  private readonly gateway = inject(ThirdPartiesGateway);
  private readonly changes = new Subject<ThirdPartyExpectedMonthInput>();
  private readonly changedEvents = new Subject<ThirdPartyExpectedMonth>();
  private readonly savingId = signal<string | null>(null);
  private readonly problemState = signal<Problem | null>(null);

  readonly savingInstallmentId = this.savingId.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly changed$ = this.changedEvents.asObservable();

  constructor() {
    this.changes
      .pipe(
        exhaustMap((input) => {
          this.savingId.set(input.installmentId);
          this.problemState.set(null);
          return this.gateway.changeExpectedMonth(input).pipe(
            tap((result) => this.changedEvents.next(result)),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingId.set(null);
        this.problemState.set(problem);
      });
  }

  change(input: ThirdPartyExpectedMonthInput): void {
    this.changes.next(input);
  }

  clearProblem(): void {
    this.problemState.set(null);
  }
}
