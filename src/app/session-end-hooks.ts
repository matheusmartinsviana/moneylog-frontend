import { inject, Provider } from '@angular/core';
import { catchError, finalize, from, Observable, of } from 'rxjs';

import {
  SESSION_END_HOOKS,
  type SessionEndHook,
} from '~/modules/auth/core/interfaces/session-end-hook';
import { GoalPhotoCache } from '~/modules/goals/core/facades/goal-photo-cache';
import { PUSH_SUBSCRIPTION_KEY } from '~/modules/notifications/core/facades/push.facade';
import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
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

export function provideSessionEndHooks(): Provider[] {
  return [
    {
      provide: SESSION_END_HOOKS,
      useFactory: () => [
        cancelPushHook(inject(NotificationsGateway)),
        revokeGoalPhotosHook(inject(GoalPhotoCache)),
        clearPrivateCachesHook(typeof caches === 'undefined' ? undefined : caches),
      ],
    },
  ];
}
