import { TestBed } from '@angular/core/testing';

import {
  PUSH_SUBSCRIPTION_KEY,
  PushFacade,
} from '~/modules/notifications/core/facades/push.facade';
import {
  aProblem,
  NotificationsGatewayStub,
  provideNotificationsStub,
  PushDeviceFake,
} from '~/testing/notifications-testing';

async function setup(
  configure: (gateway: NotificationsGatewayStub, device: PushDeviceFake) => void = () => undefined,
) {
  const gateway = new NotificationsGatewayStub();
  const device = new PushDeviceFake();
  gateway.pushConfigValue = { enabled: true, publicKey: 'VAPID' };
  configure(gateway, device);
  TestBed.configureTestingModule({
    providers: [provideNotificationsStub(gateway, device), PushFacade],
  });
  const facade = TestBed.inject(PushFacade);
  facade.load();
  await vi.waitFor(() => expect(facade.status()).not.toBe('loading'));
  return { gateway, device, facade };
}

describe('PushFacade (T136)', () => {
  it('Dado push desligado no servidor (enabled=false), então "server-off" e nada é pedido ao dispositivo', async () => {
    const { facade, device } = await setup(
      (g) => (g.pushConfigValue = { enabled: false, publicKey: null }),
    );
    expect(facade.status()).toBe('server-off');
    expect(device.subscribeKeys).toEqual([]);
  });

  it.each([404, 501])(
    'Dado %s na configuração do push, então "server-off" sem erro',
    async (status) => {
      const { facade } = await setup((g) => (g.pushConfigError = aProblem(status, 'NOT_FOUND')));
      expect(facade.status()).toBe('server-off');
      expect(facade.problem()).toBeNull();
    },
  );

  it('Dado navegador sem PushManager, então "unsupported"', async () => {
    const { facade } = await setup((_, d) => (d.capabilityValue = 'unsupported'));
    expect(facade.status()).toBe('unsupported');
  });

  it('Dado iPhone fora da PWA instalada, então "ios-needs-install"', async () => {
    const { facade } = await setup((_, d) => (d.capabilityValue = 'ios-needs-install'));
    expect(facade.status()).toBe('ios-needs-install');
  });

  it('Dado permissão negada, então "denied"', async () => {
    const { facade } = await setup((_, d) => (d.permissionValue = 'denied'));
    expect(facade.status()).toBe('denied');
  });

  it('Dado o gesto de ativar, então assina com a chave VAPID do backend, envia a assinatura e guarda o id', async () => {
    const { facade, gateway, device } = await setup();
    expect(facade.status()).toBe('ready');

    facade.enable();
    await vi.waitFor(() => expect(facade.status()).toBe('subscribed'));

    expect(device.subscribeKeys).toEqual(['VAPID']);
    expect(gateway.subscriptions).toHaveLength(1);
    expect(gateway.subscriptions[0]?.endpoint).toBe('https://push.example/abc');
    expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBe('sub-1');
  });

  it('Dado a permissão negada no pedido, então vira "denied" e nada é enviado ao backend', async () => {
    const { facade, gateway } = await setup((_, d) => (d.denyOnSubscribe = true));
    facade.enable();
    await vi.waitFor(() => expect(facade.status()).toBe('denied'));
    expect(gateway.subscriptions).toEqual([]);
  });

  it('Dado "Desativar", então chama o DELETE da assinatura e cancela no dispositivo', async () => {
    const { facade, gateway, device } = await setup();
    facade.enable();
    await vi.waitFor(() => expect(facade.status()).toBe('subscribed'));

    facade.disable();
    await vi.waitFor(() => expect(facade.status()).toBe('ready'));

    expect(gateway.calls).toContain('unsubscribe:sub-1');
    expect(device.unsubscribed).toBe(1);
    expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
  });

  describe('estado do aparelho ao abrir a tela', () => {
    const LIVE = 'https://push.example/abc';

    beforeEach(() => window.localStorage.removeItem(PUSH_SUBSCRIPTION_KEY));

    it('Dado storage limpo, permissão concedida e inscrição viva no navegador, então recupera sozinho, grava o id e fica "subscribed"', async () => {
      const { facade, gateway, device } = await setup((_, d) => {
        d.permissionValue = 'granted';
        d.endpoint = LIVE;
      });

      expect(facade.status()).toBe('subscribed');
      expect(gateway.subscriptions).toEqual([
        { endpoint: LIVE, keys: { p256dh: 'p', auth: 'a' }, userAgent: null },
      ]);
      expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBe('sub-1');
      expect(device.subscribeKeys).toEqual([]);
    });

    it('Dado a chave local presente e a inscrição viva, então "subscribed" sem chamar a API', async () => {
      window.localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'sub-9');
      const { facade, gateway } = await setup((_, d) => {
        d.permissionValue = 'granted';
        d.endpoint = LIVE;
      });

      expect(facade.status()).toBe('subscribed');
      expect(gateway.subscriptions).toEqual([]);
    });

    it('Dado falha da API na recuperação, então fica "ready" sem erro visível e sem gravar a chave', async () => {
      const { facade } = await setup((g, d) => {
        d.permissionValue = 'granted';
        d.endpoint = LIVE;
        g.subscribeError = aProblem(500, 'INTERNAL_ERROR');
      });

      expect(facade.status()).toBe('ready');
      expect(facade.problem()).toBeNull();
      expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
    });

    it.each(['default', 'denied'] as const)(
      'Dado permissão %s, então nunca tenta recuperar',
      async (permission) => {
        const { gateway, device } = await setup((_, d) => {
          d.permissionValue = permission;
          d.endpoint = LIVE;
        });

        expect(gateway.subscriptions).toEqual([]);
        expect(device.subscribeKeys).toEqual([]);
        expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
      },
    );

    it('Dado permissão concedida, sem inscrição no navegador e com chave local, então "ready" e a chave obsoleta some', async () => {
      window.localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'sub-9');
      const { facade, gateway } = await setup((_, d) => (d.permissionValue = 'granted'));

      expect(facade.status()).toBe('ready');
      expect(window.localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
      expect(gateway.subscriptions).toEqual([]);
    });
  });
});
