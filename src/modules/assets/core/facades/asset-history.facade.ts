import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import type { AssetBalancePoint } from '~/modules/assets/core/types/asset';
import { Problem, problemOf } from '~/util/api/problem';

export type AssetHistoryState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly AssetBalancePoint[] };

@Injectable()
export class AssetHistoryFacade {
  private readonly gateway = inject(AssetsGateway);
  private readonly loads = new Subject<string>();
  private readonly current = signal<AssetHistoryState>({ status: 'idle' });

  readonly state = this.current.asReadonly();
  readonly error = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((asset): AssetHistoryState => ({ status: 'ready', data: asset.history })),
            startWith<AssetHistoryState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<AssetHistoryState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  load(assetId: string): void {
    this.loads.next(assetId);
  }
}
