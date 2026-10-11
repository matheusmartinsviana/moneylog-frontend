import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export const COMPACT_QUERY = '(max-width: 640px)';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly query = this.view?.matchMedia?.(COMPACT_QUERY) ?? null;
  private readonly state = signal(this.query?.matches ?? false);

  readonly compact = this.state.asReadonly();

  constructor() {
    const query = this.query;
    if (!query) return;
    const listener = () => this.state.set(query.matches);
    query.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
  }
}
