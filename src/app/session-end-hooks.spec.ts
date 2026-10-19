import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  cancelPushHook,
  clearBusinessMemoryHook,
  clearNoteDraftsHook,
  clearPrivateCachesHook,
  forgetPushHook,
  provideSessionEndHooks,
  revokeGoalPhotosHook,
} from '~/app/session-end-hooks';
import {
  SESSION_END_HOOKS,
  SESSION_LOCAL_RESET_HOOKS,
} from '~/modules/auth/core/interfaces/session-end-hook';
import { FEATURED_CARD_KEY } from '~/modules/cards/core/facades/featured-card.facade';
import { GoalPhotoCache } from '~/modules/goals/core/facades/goal-photo-cache';
import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { PUSH_SUBSCRIPTION_KEY } from '~/modules/notifications/core/facades/push.facade';
import {
  NotificationsGatewayStub,
  PushDeviceFake,
  provideNotificationsStub,
} from '~/testing/notifications-testing';
import { LAST_ACCOUNT_KEY } from '~/util/last-used-account';
import { LAST_CARD_KEY } from '~/util/last-used-card';

describe('cancelPushHook (M4)', () => {
  afterEach(() => localStorage.clear());

  it('Dado uma assinatura guardada, quando sai, então cancela no backend e limpa o id', async () => {
    const gateway = new NotificationsGatewayStub();
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'sub-9');

    await firstValueFrom(cancelPushHook(gateway)());

    expect(gateway.calls).toContain('unsubscribe:sub-9');
    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
  });

  it('Dado o backend falhando, então não lança e ainda limpa o id', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.unsubscribePush = () => throwError(() => new Error('offline'));
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'sub-9');

    await expect(firstValueFrom(cancelPushHook(gateway)())).resolves.toBeUndefined();
    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
  });

  it('Dado nenhuma assinatura, então não chama o backend', async () => {
    const gateway = new NotificationsGatewayStub();
    await firstValueFrom(cancelPushHook(gateway)());
    expect(gateway.calls).toEqual([]);
  });
});

describe('clearPrivateCachesHook (T177)', () => {
  function fakeCaches(names: string[]) {
    const store = new Set(names);
    return {
      store,
      api: {
        keys: () => Promise.resolve([...store]),
        delete: (name: string) => Promise.resolve(store.delete(name)),
      } as unknown as CacheStorage,
    };
  }

  it('Dado caches de dados e do shell, quando sai, então apaga os de dados e mantém ngsw e idioma', async () => {
    const { store, api } = fakeCaches(['ngsw:/:db:control', 'moneylog-prefs', 'api-v1', 'outro']);

    await firstValueFrom(clearPrivateCachesHook(api)());

    expect([...store].sort()).toEqual(['moneylog-prefs', 'ngsw:/:db:control']);
  });

  it('Dado o Cache Storage indisponível ou falhando, então não lança', async () => {
    await expect(firstValueFrom(clearPrivateCachesHook(undefined)())).resolves.toBeUndefined();
    const broken = { keys: () => Promise.reject(new Error('x')) } as unknown as CacheStorage;
    await expect(firstValueFrom(clearPrivateCachesHook(broken)())).resolves.toBeUndefined();
  });
});

describe('revokeGoalPhotosHook (ADR-018)', () => {
  it('Dado fotos em memória, quando sai, então revoga todos os blob URLs e esvazia o cache', async () => {
    const revoked: string[] = [];
    let n = 0;
    URL.createObjectURL = vi.fn(() => `blob:sintetico-${++n}`);
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
    const cache = new GoalPhotoCache();
    cache.fetch('g/a/thumb', () => of(new Blob(['x']))).subscribe();
    cache.fetch('g/b/display', () => of(new Blob(['y']))).subscribe();

    await firstValueFrom(revokeGoalPhotosHook(cache)());

    expect(revoked.sort()).toEqual(['blob:sintetico-1', 'blob:sintetico-2']);
    expect(cache.size).toBe(0);
  });
});

describe('limpeza local ao trocar de usuário (T11)', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('Dado rascunhos de notas e outras chaves, quando limpa, então remove só os rascunhos', async () => {
    sessionStorage.setItem('moneylog:note-draft:n1', '{"body":"A","version":1}');
    sessionStorage.setItem('moneylog:note-draft:n2', '{"body":"B","version":2}');
    sessionStorage.setItem('outra', 'x');

    await firstValueFrom(clearNoteDraftsHook(sessionStorage)());

    expect(sessionStorage.getItem('moneylog:note-draft:n1')).toBeNull();
    expect(sessionStorage.getItem('moneylog:note-draft:n2')).toBeNull();
    expect(sessionStorage.getItem('outra')).toBe('x');
  });

  it('Dado storage indisponível, então não lança', async () => {
    await expect(firstValueFrom(clearNoteDraftsHook(undefined)())).resolves.toBeUndefined();
  });

  it('Dado a assinatura de push do usuário anterior, quando esquece, então remove o id local e cancela a assinatura do navegador sem chamar o backend', async () => {
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'sub-9');
    const device = new PushDeviceFake();

    await firstValueFrom(forgetPushHook(device)());

    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
    expect(device.unsubscribed).toBe(1);
  });

  it('Dado o navegador falhando ao cancelar o push, então não lança', async () => {
    const device = new PushDeviceFake();
    device.unsubscribe = () => Promise.reject(new Error('x'));

    await expect(firstValueFrom(forgetPushHook(device)())).resolves.toBeUndefined();
  });

  it('Dado cartão, conta e destaque do usuário anterior, quando limpa, então remove as três chaves e mantém as preferências', async () => {
    localStorage.setItem(LAST_CARD_KEY, 'c1');
    localStorage.setItem(LAST_ACCOUNT_KEY, 'a1');
    localStorage.setItem(FEATURED_CARD_KEY, 'c2');
    localStorage.setItem('moneylog-theme', 'dark');

    await firstValueFrom(clearBusinessMemoryHook()());

    expect(localStorage.getItem(LAST_CARD_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_ACCOUNT_KEY)).toBeNull();
    expect(localStorage.getItem(FEATURED_CARD_KEY)).toBeNull();
    expect(localStorage.getItem('moneylog-theme')).toBe('dark');
  });

  it('Dado o provider da sessão, então registra o conjunto completo de limpeza local e de saída', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNotificationsStub(),
        { provide: ProfileFacade, useValue: { clear: vi.fn() } },
        GoalPhotoCache,
        provideSessionEndHooks(),
      ],
    });

    expect(TestBed.inject(SESSION_LOCAL_RESET_HOOKS)).toHaveLength(6);
    expect(TestBed.inject(SESSION_END_HOOKS)).toHaveLength(6);
  });
});
