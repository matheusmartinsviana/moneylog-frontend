import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import type { NotificationSettings } from '~/modules/notifications/core/types/notification';
import { Problem, problemOf } from '~/util/api/problem';

export type SettingsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly settings: NotificationSettings };

@Injectable()
export class NotificationSettingsFacade {
  private readonly gateway = inject(NotificationsGateway);
  private readonly profile = inject(ProfileFacade);
  private readonly loads = new Subject<boolean>();
  private readonly refreshFailures = new Subject<void>();
  private readonly saves = new Subject<NotificationSettings>();
  private readonly current = signal<SettingsState>({ status: 'loading' });
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly savedState = signal(false);

  readonly state = this.current.asReadonly();
  readonly settings = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.settings : null;
  });
  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly saved = this.savedState.asReadonly();
  readonly refreshFailed$ = this.refreshFailures.asObservable();

  constructor() {
    this.loads
      .pipe(
        switchMap((silent) => {
          const keep = silent ? this.current() : null;
          const quiet = keep?.status === 'ready';
          return this.gateway.settings().pipe(
            tap((settings) => this.profile.adopt(settings)),
            map((settings): SettingsState => ({ status: 'ready', settings })),
            startWith<SettingsState>(quiet && keep ? keep : { status: 'loading' }),
            catchError((error: unknown) => {
              if (quiet && keep) {
                this.refreshFailures.next();
                return of<SettingsState>(keep);
              }
              return of<SettingsState>({ status: 'error', problem: problemOf(error) });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));

    this.saves
      .pipe(
        exhaustMap((input) => {
          this.savingState.set(true);
          this.problemState.set(null);
          this.savedState.set(false);
          return this.gateway.saveSettings(input).pipe(
            tap((settings) => {
              this.current.set({ status: 'ready', settings });
              this.profile.adopt(settings);
              this.savedState.set(true);
            }),
            map(() => null),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              this.problemState.set(problem);
              if (problem.code === 'VERSION_CONFLICT') this.loads.next(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.savingState.set(false));
  }

  load(): void {
    this.loads.next(false);
  }

  refresh(): void {
    this.loads.next(true);
  }

  save(settings: NotificationSettings): void {
    this.saves.next(settings);
  }

  markEdited(): void {
    this.savedState.set(false);
  }
}
