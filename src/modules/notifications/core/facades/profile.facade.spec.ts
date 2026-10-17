import { TestBed } from '@angular/core/testing';

import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import {
  aProblem,
  NotificationsGatewayStub,
  provideNotificationsStub,
  someSettings,
} from '~/testing/notifications-testing';

describe('ProfileFacade', () => {
  let counter = 0;
  let revoked: string[] = [];
  beforeEach(() => {
    counter = 0;
    revoked = [];
    URL.createObjectURL = vi.fn(() => `blob:sintetico-${++counter}`);
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
  });

  function setup(gateway = new NotificationsGatewayStub()) {
    TestBed.configureTestingModule({ providers: provideNotificationsStub(gateway) });
    return { gateway, facade: TestBed.inject(ProfileFacade) };
  }

  it('Dado settings sem foto, então carrega o apelido e não busca o conteúdo', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ displayName: 'Ana' });
    const { facade } = setup(gateway);

    facade.ensureLoaded();

    expect(facade.displayName()).toBe('Ana');
    expect(facade.photoUrl()).toBeNull();
    expect(gateway.photoContentCalls).toBe(0);
  });

  it('Dado settings com foto, então busca uma vez e reaproveita a mesma versão', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ hasPhoto: true, photoVersion: 4 });
    const { facade } = setup(gateway);

    facade.load();
    facade.load();

    expect(gateway.photoContentCalls).toBe(1);
    expect(facade.photoUrl()).toBe('blob:sintetico-1');
  });

  it('Dado trocar a foto, então usa o photoVersion da resposta e revoga o URL antigo', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ hasPhoto: true, photoVersion: 1 });
    const { facade } = setup(gateway);
    facade.load();

    facade.uploadPhoto(new File(['x'], 'eu.png', { type: 'image/png' }));

    expect(gateway.uploaded).toEqual(['eu.png']);
    expect(facade.settings()?.photoVersion).toBe(2);
    expect(facade.photoUrl()).toBe('blob:sintetico-2');
    expect(revoked).toEqual(['blob:sintetico-1']);
    expect(facade.notice()).toBe('photoUpdated');
  });

  it('Dado remover a foto, então volta ao fallback e revoga o URL', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ hasPhoto: true, photoVersion: 1 });
    const { facade } = setup(gateway);
    facade.load();

    facade.removePhoto();

    expect(gateway.removedPhoto).toBe(1);
    expect(facade.hasPhoto()).toBe(false);
    expect(facade.photoUrl()).toBeNull();
    expect(revoked).toEqual(['blob:sintetico-1']);
  });

  it('Dado falha no envio, então guarda o problema e mantém a foto atual', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ hasPhoto: true, photoVersion: 1 });
    gateway.uploadError = aProblem(422, 'GOAL_PHOTO_TOO_LARGE');
    const { facade } = setup(gateway);
    facade.load();

    facade.uploadPhoto(new File(['x'], 'grande.png'));

    expect(facade.problem()?.code).toBe('GOAL_PHOTO_TOO_LARGE');
    expect(facade.photoUrl()).toBe('blob:sintetico-1');
    expect(facade.busy()).toBe(false);
  });

  it('Dado salvar o apelido, então envia a version carregada e adota a resposta', () => {
    const gateway = new NotificationsGatewayStub();
    const { facade } = setup(gateway);
    facade.load();

    facade.saveDisplayName('  Bia ');

    expect(gateway.savedSettings[0]?.displayName).toBe('Bia');
    expect(gateway.savedSettings[0]?.version).toBe(3);
    expect(facade.displayName()).toBe('Bia');
    expect(facade.settings()?.version).toBe(4);
  });

  it('Dado o fim da sessão, então limpa o estado e revoga o URL', () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ hasPhoto: true, photoVersion: 1 });
    const { facade } = setup(gateway);
    facade.load();

    facade.clear();

    expect(facade.settings()).toBeNull();
    expect(facade.photoUrl()).toBeNull();
    expect(facade.status()).toBe('idle');
    expect(revoked).toEqual(['blob:sintetico-1']);
  });

  it('Dado o gateway, então a porta é a do módulo', () => {
    setup();

    expect(TestBed.inject(NotificationsGateway)).toBeInstanceOf(NotificationsGatewayStub);
  });
});
