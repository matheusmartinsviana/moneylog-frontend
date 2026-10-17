import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, switchMap } from 'rxjs';

interface IdleWindow {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
}

interface ConnectionHints {
  saveData?: boolean;
  effectiveType?: string;
}

const IDLE_TIMEOUT_MS = 3000;

@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  private readonly view = inject(DOCUMENT).defaultView;

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false || this.constrained()) return EMPTY;
    return new Observable<void>((subscriber) => {
      const idle = this.view as (Window & IdleWindow) | null;
      const run = () => {
        subscriber.next();
        subscriber.complete();
      };
      if (idle?.requestIdleCallback) {
        const handle = idle.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
        return () => (idle as unknown as Window).cancelIdleCallback?.(handle);
      }
      const handle = setTimeout(run, 1500);
      return () => clearTimeout(handle);
    }).pipe(switchMap(() => load()));
  }

  private constrained(): boolean {
    const connection = (this.view?.navigator as { connection?: ConnectionHints } | undefined)
      ?.connection;
    return connection?.saveData === true || /(^|-)2g$/.test(connection?.effectiveType ?? '');
  }
}
