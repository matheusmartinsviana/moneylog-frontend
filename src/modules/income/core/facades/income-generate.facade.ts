import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type { GeneratedIncomeOccurrence } from '~/modules/income/core/types/income';
import { Problem, problemOf } from '~/util/api/problem';

interface GenerateRequest {
  readonly profileId: string;
  readonly from: string;
  readonly to: string;
}

type GenerateOutcome =
  | { readonly ok: true; readonly items: readonly GeneratedIncomeOccurrence[] }
  | { readonly ok: false; readonly problem: Problem };

@Injectable()
export class IncomeGenerateFacade {
  private readonly gateway = inject(IncomeGateway);
  private readonly requests = new Subject<GenerateRequest>();
  private readonly generatingState = signal(false);
  private readonly resultState = signal<readonly GeneratedIncomeOccurrence[] | null>(null);
  private readonly problemState = signal<Problem | null>(null);

  readonly generating = this.generatingState.asReadonly();
  readonly result = this.resultState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly createdCount = computed(
    () => this.resultState()?.filter((item) => item.created).length ?? 0,
  );
  readonly existingCount = computed(
    () => this.resultState()?.filter((item) => !item.created).length ?? 0,
  );

  constructor() {
    this.requests
      .pipe(
        exhaustMap((request) => {
          this.generatingState.set(true);
          this.problemState.set(null);
          return this.gateway.generate(request.profileId, request.from, request.to).pipe(
            map((items): GenerateOutcome => ({ ok: true, items })),
            catchError((error: unknown) =>
              of<GenerateOutcome>({ ok: false, problem: problemOf(error) }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((outcome) => {
        this.generatingState.set(false);
        if (outcome.ok) this.resultState.set(outcome.items);
        else this.problemState.set(outcome.problem);
      });
  }

  generate(profileId: string, from: string, to: string): void {
    this.requests.next({ profileId, from, to });
  }

  reset(): void {
    this.resultState.set(null);
    this.problemState.set(null);
  }
}
