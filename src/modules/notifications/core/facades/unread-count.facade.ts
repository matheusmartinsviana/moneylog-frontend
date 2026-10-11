import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  fromEvent,
  map,
  merge,
  startWith,
  switchMap,
  timer,
} from 'rxjs';

import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';

export const UNREAD_POLL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class UnreadCountFacade {
  private readonly gateway = inject(NotificationsGateway);
  private readonly document = inject(DOCUMENT);
  private readonly countState = signal<number | null>(null);
  private connected = false;

  readonly count = this.countState.asReadonly();

  connect(destroyRef: DestroyRef): void {
    if (this.connected) return;
    this.connected = true;
    destroyRef.onDestroy(() => (this.connected = false));
    const win = this.document.defaultView;
    const active = () =>
      this.document.visibilityState !== 'hidden' && (win?.navigator.onLine ?? true);
    const changes = win
      ? merge(
          fromEvent(this.document, 'visibilitychange'),
          fromEvent(win, 'online'),
          fromEvent(win, 'offline'),
        )
      : EMPTY;
    changes
      .pipe(
        startWith(null),
        map(active),
        distinctUntilChanged(),
        switchMap((on) =>
          on ? timer(0, UNREAD_POLL_MS).pipe(exhaustMap(() => this.fetch())) : EMPTY,
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((count) => this.countState.set(count));
  }

  refresh(): void {
    this.fetch().subscribe((count) => this.countState.set(count));
  }

  private fetch() {
    return this.gateway.unreadCount().pipe(catchError(() => EMPTY));
  }
}
