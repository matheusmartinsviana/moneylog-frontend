import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotesGateway } from '~/modules/notes/core/interfaces/notes.gateway';
import { Problem, problemOf } from '~/util/api/problem';

export type VaultOverviewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly lastChange: string | null };

@Injectable()
export class VaultOverviewFacade {
  private readonly gateway = inject(NotesGateway);
  private readonly destroyRef = inject(DestroyRef);
  private readonly current = signal<VaultOverviewState>({ status: 'loading' });

  readonly state = this.current.asReadonly();
  readonly lastChange = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.lastChange : null;
  });

  load(): void {
    this.current.set({ status: 'loading' });
    this.gateway
      .list({ status: 'ACTIVE', sort: 'UPDATED', page: 1, pageSize: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slice) =>
          this.current.set({ status: 'ready', lastChange: slice.items[0]?.updatedAt ?? null }),
        error: (error: unknown) => this.current.set({ status: 'error', problem: problemOf(error) }),
      });
  }
}
