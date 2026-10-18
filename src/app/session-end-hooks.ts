import { inject, Provider } from '@angular/core';
import { catchError, finalize, from, Observable, of } from 'rxjs';

import { NOTE_DRAFT_PREFIX } from '~/app/features/notes/services/note-draft.store';
import {
  SESSION_END_HOOKS,
  SESSION_LOCAL_RESET_HOOKS,
  type SessionEndHook,
} from '~/modules/auth/core/interfaces/session-end-hook';
import { FEATURED_CARD_KEY } from '~/modules/cards/core/facades/featured-card.facade';
import { GoalPhotoCache } from '~/modules/goals/core/facades/goal-photo-cache';
import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { PUSH_SUBSCRIPTION_KEY } from '~/modules/notifications/core/facades/push.facade';
import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import { PushDevice } from '~/modules/notifications/core/interfaces/push-device';
import { LAST_ACCOUNT_KEY } from '~/util/last-used-account';
import { LAST_CARD_KEY } from '~/util/last-used-card';
import { readStorage, removeStorage } from '~/util/safe-storage';

export function cancelPushHook(gateway: NotificationsGateway): SessionEndHook {
  return (): Observable<unknown> => {
    const id = readStorage(PUSH_SUBSCRIPTION_KEY);
    if (!id) return of(undefined);
    return gateway.unsubscribePush(id).pipe(
      catchError(() => of(undefined)),
      finalize(() => removeStorage(PUSH_SUBSCRIPTION_KEY)),
    );
  };
}

const KEPT_CACHE_PREFIXES = ['ngsw:', 'moneylog-prefs'];

export function clearPrivateCachesHook(cacheStorage: CacheStorage | undefined): SessionEndHook {
  return (): Observable<unknown> =>
    from(
      (async () => {
        if (!cacheStorage) return;
        const names = await cacheStorage.keys();
        await Promise.all(
          names
            .filter((name) => !KEPT_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix)))
            .map((name) => cacheStorage.delete(name)),
        );
      })(),
    ).pipe(catchError(() => of(undefined)));
}

export function revokeGoalPhotosHook(cache: GoalPhotoCache): SessionEndHook {
  return (): Observable<unknown> => {
    cache.clear();
    return of(undefined);
  };
}

export function clearProfileHook(profile: ProfileFacade): SessionEndHook {
  return (): Observable<unknown> => {
    profile.clear();
    return of(undefined);
  };
}

export function forgetPushHook(device: PushDevice): SessionEndHook {
  return (): Observable<unknown> => {
    removeStorage(PUSH_SUBSCRIPTION_KEY);
    return from(device.unsubscribe()).pipe(catchError(() => of(undefined)));
  };
}

const BUSINESS_KEYS = [LAST_CARD_KEY, LAST_ACCOUNT_KEY, FEATURED_CARD_KEY];

export function clearBusinessMemoryHook(): SessionEndHook {
  return (): Observable<unknown> => {
    BUSINESS_KEYS.forEach((key) => removeStorage(key));
    return of(undefined);
  };
}

export function clearNoteDraftsHook(store: Storage | undefined): SessionEndHook {
  return (): Observable<unknown> => {
    try {
      if (store) {
        const keys: string[] = [];
        for (let index = 0; index < store.length; index++) {
          const key = store.key(index);
          if (key?.startsWith(NOTE_DRAFT_PREFIX)) keys.push(key);
        }
        keys.forEach((key) => store.removeItem(key));
      }
    } catch {}
    return of(undefined);
  };
}

function sessionStorageOrUndefined(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function provideSessionEndHooks(): Provider[] {
  const cacheStorage = () => (typeof caches === 'undefined' ? undefined : caches);
  return [
    {
      provide: SESSION_END_HOOKS,
      useFactory: () => [
        cancelPushHook(inject(NotificationsGateway)),
        clearBusinessMemoryHook(),
        revokeGoalPhotosHook(inject(GoalPhotoCache)),
        clearProfileHook(inject(ProfileFacade)),
        clearNoteDraftsHook(sessionStorageOrUndefined()),
        clearPrivateCachesHook(cacheStorage()),
      ],
    },
    {
      provide: SESSION_LOCAL_RESET_HOOKS,
      useFactory: () => [
        forgetPushHook(inject(PushDevice)),
        clearBusinessMemoryHook(),
        revokeGoalPhotosHook(inject(GoalPhotoCache)),
        clearProfileHook(inject(ProfileFacade)),
        clearNoteDraftsHook(sessionStorageOrUndefined()),
        clearPrivateCachesHook(cacheStorage()),
      ],
    },
  ];
}
