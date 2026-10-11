import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  exhaustMap,
  from,
  lastValueFrom,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import { PushDevice } from '~/modules/notifications/core/interfaces/push-device';
import { Problem, problemOf } from '~/util/api/problem';
import { readStorage, removeStorage, writeStorage } from '~/util/safe-storage';

export const PUSH_SUBSCRIPTION_KEY = 'moneylog.pushSubscriptionId';

export type PushStatus =
  | 'loading'
  | 'server-off'
  | 'unsupported'
  | 'ios-needs-install'
  | 'denied'
  | 'ready'
  | 'subscribed'
  | 'error';

@Injectable()
export class PushFacade {
  private readonly gateway = inject(NotificationsGateway);
  private readonly device = inject(PushDevice);
  private readonly loads = new Subject<void>();
  private readonly commands = new Subject<'enable' | 'disable'>();
  private readonly statusState = signal<PushStatus>('loading');
  private readonly busyState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private publicKey: string | null = null;

  readonly status = this.statusState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly problem = this.problemState.asReadonly();

  constructor() {
    this.loads
      .pipe(
        switchMap(() =>
          this.gateway.pushConfig().pipe(
            switchMap((config) => {
              this.publicKey = config.publicKey;
              if (!config.enabled || !config.publicKey) return of<PushStatus>('server-off');
              return from(this.deviceStatus());
            }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              if (problem.status === 404 || problem.status === 501) {
                return of<PushStatus>('server-off');
              }
              this.problemState.set(problem);
              return of<PushStatus>('error');
            }),
            startWith<PushStatus>('loading'),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((status) => this.statusState.set(status));

    this.commands
      .pipe(
        exhaustMap((command) => {
          this.busyState.set(true);
          this.problemState.set(null);
          const run = command === 'enable' ? this.enableFlow() : this.disableFlow();
          return from(run).pipe(
            tap((status) => this.statusState.set(status)),
            catchError((error: unknown) => {
              if (error instanceof Error && error.message === 'push-denied') {
                this.statusState.set('denied');
              } else {
                this.problemState.set(problemOf(error));
              }
              return of(null);
            }),
            map(() => null),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.busyState.set(false));
  }

  load(): void {
    this.loads.next();
  }

  enable(): void {
    if (this.statusState() === 'ready') this.commands.next('enable');
  }

  disable(): void {
    if (this.statusState() === 'subscribed') this.commands.next('disable');
  }

  private async deviceStatus(): Promise<PushStatus> {
    const capability = this.device.capability();
    if (capability !== 'supported') return capability;
    if (this.device.permission() === 'denied') return 'denied';
    const endpoint = await this.device.currentEndpoint();
    return endpoint !== null && readStorage(PUSH_SUBSCRIPTION_KEY) !== null
      ? 'subscribed'
      : 'ready';
  }

  private async enableFlow(): Promise<PushStatus> {
    if (!this.publicKey) return 'server-off';
    const subscription = await this.device.subscribe(this.publicKey);
    const id = await lastValueFrom(this.gateway.subscribePush(subscription));
    writeStorage(PUSH_SUBSCRIPTION_KEY, id);
    return 'subscribed';
  }

  private async disableFlow(): Promise<PushStatus> {
    const id = readStorage(PUSH_SUBSCRIPTION_KEY);
    if (id) {
      try {
        await lastValueFrom(this.gateway.unsubscribePush(id), { defaultValue: undefined });
      } catch (error) {
        if (problemOf(error).status !== 404) throw error;
      }
    }
    await this.device.unsubscribe();
    removeStorage(PUSH_SUBSCRIPTION_KEY);
    return 'ready';
  }
}
