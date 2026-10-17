import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  distinctUntilChanged,
  exhaustMap,
  map,
  merge,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import type { NotificationSettings } from '~/modules/notifications/core/types/notification';
import { Problem, problemOf } from '~/util/api/problem';

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ProfileNotice = 'saved' | 'photoUpdated' | 'photoRemoved';

interface PhotoSlot {
  readonly hasPhoto: boolean;
  readonly photoVersion: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileFacade {
  private readonly gateway = inject(NotificationsGateway);
  private readonly loads = new Subject<void>();
  private readonly nameSaves = new Subject<string | null>();
  private readonly uploads = new Subject<File>();
  private readonly removals = new Subject<void>();
  private readonly slots = new Subject<PhotoSlot>();
  private readonly settingsState = signal<NotificationSettings | null>(null);
  private readonly statusState = signal<ProfileStatus>('idle');
  private readonly busyState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly noticeState = signal<ProfileNotice | null>(null);
  private readonly urlState = signal<string | null>(null);

  readonly settings = this.settingsState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly photoUrl = this.urlState.asReadonly();
  readonly displayName = computed(() => this.settingsState()?.displayName ?? null);
  readonly hasPhoto = computed(() => this.settingsState()?.hasPhoto ?? false);

  constructor() {
    this.loads
      .pipe(
        switchMap(() => {
          this.statusState.set('loading');
          return this.gateway.settings().pipe(
            map((settings) => ({ settings }) as const),
            catchError((error: unknown) => of({ problem: problemOf(error) } as const)),
          );
        }),
      )
      .subscribe((result) => {
        if ('settings' in result) {
          this.adopt(result.settings);
          this.statusState.set('ready');
        } else {
          this.problemState.set(result.problem);
          this.statusState.set(this.settingsState() ? 'ready' : 'error');
        }
      });

    this.slots
      .pipe(
        distinctUntilChanged(
          (a, b) => a.hasPhoto === b.hasPhoto && a.photoVersion === b.photoVersion,
        ),
        switchMap((slot) => this.fetchPhoto(slot)),
      )
      .subscribe((url) => this.swapUrl(url));

    this.nameSaves
      .pipe(
        exhaustMap((displayName) => {
          const current = this.settingsState();
          if (!current) return of(null);
          return this.action(
            this.gateway.saveSettings({ ...current, displayName }),
            (settings) => this.adopt(settings),
            'saved',
          );
        }),
      )
      .subscribe();

    merge(
      this.uploads.pipe(
        exhaustMap((file) =>
          this.action(
            this.gateway.uploadProfilePhoto(file, file.name),
            (photo) => this.patchPhoto(photo),
            'photoUpdated',
          ),
        ),
      ),
      this.removals.pipe(
        exhaustMap(() =>
          this.action(
            this.gateway.removeProfilePhoto(),
            () => this.patchPhoto({ hasPhoto: false, photoVersion: 0 }),
            'photoRemoved',
          ),
        ),
      ),
    ).subscribe();
  }

  ensureLoaded(): void {
    if (this.statusState() === 'idle') this.loads.next();
  }

  load(): void {
    this.loads.next();
  }

  adopt(settings: NotificationSettings): void {
    this.settingsState.set(settings);
    this.slots.next({ hasPhoto: settings.hasPhoto, photoVersion: settings.photoVersion });
  }

  saveDisplayName(value: string): void {
    const trimmed = value.trim();
    this.nameSaves.next(trimmed === '' ? null : trimmed);
  }

  uploadPhoto(file: File): void {
    this.uploads.next(file);
  }

  removePhoto(): void {
    this.removals.next();
  }

  dismissFeedback(): void {
    this.problemState.set(null);
    this.noticeState.set(null);
  }

  clear(): void {
    this.swapUrl(null);
    this.settingsState.set(null);
    this.statusState.set('idle');
    this.problemState.set(null);
    this.noticeState.set(null);
    this.busyState.set(false);
    this.slots.next({ hasPhoto: false, photoVersion: -1 });
  }

  private patchPhoto(photo: PhotoSlot): void {
    const current = this.settingsState();
    if (current) this.adopt({ ...current, ...photo });
  }

  private action<T>(
    request: Observable<T>,
    apply: (value: T) => void,
    notice: ProfileNotice,
  ): Observable<null> {
    this.busyState.set(true);
    this.problemState.set(null);
    this.noticeState.set(null);
    return request.pipe(
      tap((value) => {
        apply(value);
        this.noticeState.set(notice);
      }),
      map(() => null),
      catchError((error: unknown) => {
        const problem = problemOf(error);
        this.problemState.set(problem);
        if (problem.code === 'VERSION_CONFLICT') this.loads.next();
        return of(null);
      }),
      tap({
        next: () => this.busyState.set(false),
        complete: () => this.busyState.set(false),
      }),
    );
  }

  private fetchPhoto(slot: PhotoSlot): Observable<string | null> {
    if (!slot.hasPhoto) return of(null);
    return this.gateway.profilePhotoContent().pipe(
      map((blob) => URL.createObjectURL(blob)),
      catchError(() => of(null)),
    );
  }

  private swapUrl(next: string | null): void {
    const previous = this.urlState();
    this.urlState.set(next);
    if (previous && previous !== next) URL.revokeObjectURL(previous);
  }
}
