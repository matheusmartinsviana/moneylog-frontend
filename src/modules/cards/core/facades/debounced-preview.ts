import { computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, Subject, switchMap, timer } from 'rxjs';

import { Problem, problemOf } from '~/util/api/problem';

export const PREVIEW_DEBOUNCE_MS = 300;

export type PreviewState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: T };

const IDLE: PreviewState<never> = { status: 'idle' };

export class DebouncedPreview<K, T> {
  private readonly requests = new Subject<K | null>();
  private readonly current = signal<PreviewState<T>>(IDLE);

  readonly state = this.current.asReadonly();
  readonly data = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.data : null;
  });
  readonly loading = computed(() => this.current().status === 'loading');
  readonly problem = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });

  constructor(fetch: (key: K) => Observable<T>, debounceMs: number = PREVIEW_DEBOUNCE_MS) {
    this.requests
      .pipe(
        switchMap((key) =>
          key === null
            ? of<PreviewState<T>>(IDLE)
            : timer(debounceMs).pipe(
                switchMap(() =>
                  fetch(key).pipe(
                    map((data): PreviewState<T> => ({ status: 'ready', data })),
                    catchError((error: unknown) =>
                      of<PreviewState<T>>({ status: 'error', problem: problemOf(error) }),
                    ),
                  ),
                ),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  request(key: K | null): void {
    this.current.set(key === null ? IDLE : { status: 'loading' });
    this.requests.next(key);
  }
}
