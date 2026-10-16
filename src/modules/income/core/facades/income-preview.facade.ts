import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import type { IncomePreview } from '~/modules/income/core/types/income';
import { Problem, problemOf } from '~/util/api/problem';

export const TAX_TABLE_UNAVAILABLE = 'TAX_TABLE_UNAVAILABLE';

export type IncomePreviewState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: IncomePreview };

interface PreviewRequest {
  readonly profileId: string;
  readonly month: string;
}

@Injectable()
export class IncomePreviewFacade {
  private readonly gateway = inject(IncomeGateway);
  private readonly requests = new Subject<PreviewRequest | null>();
  private readonly current = signal<IncomePreviewState>({ status: 'idle' });

  readonly state = this.current.asReadonly();
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });
  readonly problem = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly taxTableUnavailable = computed(() => this.problem()?.code === TAX_TABLE_UNAVAILABLE);

  constructor() {
    this.requests
      .pipe(
        switchMap((request) =>
          request === null
            ? of<IncomePreviewState>({ status: 'idle' })
            : this.gateway.preview(request.profileId, request.month).pipe(
                map((data): IncomePreviewState => ({ status: 'ready', data })),
                startWith<IncomePreviewState>({ status: 'loading' }),
                catchError((error: unknown) =>
                  of<IncomePreviewState>({ status: 'error', problem: problemOf(error) }),
                ),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(profileId: string, month: string): void {
    this.requests.next({ profileId, month });
  }

  clear(): void {
    this.requests.next(null);
  }
}
