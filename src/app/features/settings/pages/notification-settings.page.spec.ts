import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { NotificationSettingsPage } from '~/app/features/settings/pages/notification-settings.page';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aProblem,
  NotificationsGatewayStub,
  provideNotificationsStub,
  PushDeviceFake,
  someSettings,
} from '~/testing/notifications-testing';

async function setup(gateway = new NotificationsGatewayStub(), device = new PushDeviceFake()) {
  const result = await render(NotificationSettingsPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideNotificationsStub(gateway, device),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway, device };
}

describe('NotificationSettingsPage (T136)', () => {
  it('Dado as configurações do backend, então preenche o formulário', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ displayName: 'Ana', kinds: { INVOICE_DUE: false } });
    await setup(gateway);

    expect(screen.getByTestId('settings-daily-time')).toHaveTextContent('08:00');
    expect(screen.getByTestId('settings-quiet-from')).toHaveTextContent('22:00');
    expect(screen.getByTestId('settings-quiet-to')).toHaveTextContent('07:00');
    expect(screen.getByTestId('settings-display-name')).toHaveValue('Ana');
    expect(screen.getByTestId('settings-kind-INVOICE_DUE')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByTestId('settings-kind-DEBT_COLLECT')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('Dado salvar, então envia a version carregada e mostra o resultado do backend', async () => {
    const gateway = new NotificationsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('settings-kind-GOAL_DEADLINE'));
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.savedSettings).toHaveLength(1);
    expect(gateway.savedSettings[0]?.version).toBe(3);
    expect(gateway.savedSettings[0]?.kinds.GOAL_DEADLINE).toBe(false);
    expect(screen.getByTestId('notification-settings-saved')).toBeInTheDocument();
  });

  it('Dado os parâmetros dos alertas, então preenche, salva e deixa vazio como inativo', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({
      alerts: {
        subscriptionUnusedDays: 60,
        invoiceDueLeadDays: 5,
        documentDivergenceTolerance: '2.00',
      },
    });
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('settings-unused-days')).toHaveValue('60');

    await userEvent.clear(screen.getByTestId('settings-unused-days'));
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();

    expect(gateway.savedSettings[0]?.alerts).toEqual({
      subscriptionUnusedDays: null,
      invoiceDueLeadDays: 5,
      documentDivergenceTolerance: '2.00',
    });
  });

  it('Dado a tolerância padrão de 0,00 (contrato 2.32.0), então o salvar funciona sem o usuário mexer nela', async () => {
    const gateway = new NotificationsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();

    expect(gateway.savedSettings).toHaveLength(1);
    expect(gateway.savedSettings[0]?.alerts.documentDivergenceTolerance).toBe('0.00');
  });

  it('Dado a seção de alertas, então oferece um interruptor para cada um dos dez alertas novos', async () => {
    await setup();

    for (const kind of [
      'INVOICE_DUE_AUTODEBIT_OFF',
      'NEGATIVE_MONTH_PROJECTED',
      'NEW_DEBT_BEFORE_FINANCING',
      'CARD_CASH_OUT_COST',
      'SUBSCRIPTION_OVERLAP',
      'SUBSCRIPTION_UNUSED',
      'WEEKLY_CHARGE',
      'THIRD_PARTY_OVERDUE',
      'BALANCE_BELOW_REAL_ESTATE',
      'DOCUMENT_DIVERGENCE',
    ]) {
      expect(screen.getByTestId(`settings-kind-${kind}`)).toHaveAttribute('aria-checked', 'true');
    }
  });

  it.each(['0', '3651', 'abc', '-5'])(
    'Dado "%s" dias sem uso, então mostra o erro e não salva',
    async (value) => {
      const gateway = new NotificationsGatewayStub();
      gateway.settingsValue = someSettings({
        alerts: {
          subscriptionUnusedDays: null,
          invoiceDueLeadDays: 3,
          documentDivergenceTolerance: '1.00',
        },
      });
      const { fixture } = await setup(gateway);

      await userEvent.type(screen.getByTestId('settings-unused-days'), value);
      await userEvent.click(screen.getByTestId('notification-settings-save'));
      await fixture.whenStable();

      expect(gateway.savedSettings).toEqual([]);
    },
  );

  it('Dado a antecedência da fatura e a tolerância alteradas, então o salvar envia os dois do jeito do contrato', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({
      alerts: {
        subscriptionUnusedDays: 45,
        invoiceDueLeadDays: 3,
        documentDivergenceTolerance: '1.00',
      },
    });
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('settings-lead-days-increase'));
    await userEvent.click(screen.getByTestId('settings-lead-days-increase'));
    await userEvent.clear(screen.getByTestId('settings-document-tolerance'));
    await userEvent.type(screen.getByTestId('settings-document-tolerance'), '1,50');
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();

    expect(gateway.savedSettings[0]?.alerts).toEqual({
      subscriptionUnusedDays: 45,
      invoiceDueLeadDays: 5,
      documentDivergenceTolerance: '1.50',
    });
  });

  it('Dado NOTIFICATION_THRESHOLD_INVALID do servidor, então mostra um aviso e mantém o digitado', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({
      alerts: {
        subscriptionUnusedDays: 45,
        invoiceDueLeadDays: 3,
        documentDivergenceTolerance: '1.00',
      },
    });
    gateway.saveError = aProblem(422, 'NOTIFICATION_THRESHOLD_INVALID');
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('notification-settings-error')).toBeInTheDocument();
    expect(screen.getByTestId('settings-unused-days')).toHaveValue('45');
  });

  it('Dado um alerta desligado, então o salvar envia o tipo como falso', async () => {
    const gateway = new NotificationsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('settings-kind-SUBSCRIPTION_UNUSED'));
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();

    expect(gateway.savedSettings[0]?.kinds.SUBSCRIPTION_UNUSED).toBe(false);
  });

  it('Dado que escolho os horários no seletor, então o salvar envia o resumo e a janela de silêncio escolhidos', async () => {
    const gateway = new NotificationsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('settings-daily-time'));
    await userEvent.click(screen.getByTestId('settings-daily-time-hour-09'));
    await userEvent.click(screen.getByTestId('settings-daily-time-minute-30'));
    await userEvent.click(screen.getByTestId('settings-quiet-from'));
    await userEvent.click(screen.getByTestId('settings-quiet-from-hour-23'));
    await userEvent.click(screen.getByTestId('settings-quiet-from-minute-15'));
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();

    expect(gateway.savedSettings[0]?.dailySummary.time).toBe('09:30');
    expect(gateway.savedSettings[0]?.quietHours).toEqual({ from: '23:15', to: '07:00' });
  });

  it('Dado 409 (VERSION_CONFLICT), então avisa e recarrega a versão atual', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.saveError = aProblem(409, 'VERSION_CONFLICT');
    const { fixture } = await setup(gateway);
    await userEvent.click(screen.getByTestId('notification-settings-save'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(screen.getByTestId('notification-settings-error')).toHaveTextContent(
      'As configurações mudaram em outro lugar',
    );
  });

  it('Dado push desligado no servidor, então diz isso em texto e não oferece o botão', async () => {
    await setup();
    expect(screen.getByTestId('push-status')).toHaveTextContent(
      'Notificações no dispositivo ainda não estão ativadas neste servidor.',
    );
    expect(screen.queryByTestId('push-enable')).not.toBeInTheDocument();
  });

  it('Dado iPhone fora da PWA, então explica como instalar (em texto)', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const device = new PushDeviceFake();
    device.capabilityValue = 'ios-needs-install';
    await setup(gateway, device);
    expect(screen.getByTestId('push-status')).toHaveTextContent(
      'No iPhone, adicione o app à tela inicial',
    );
    expect(screen.queryByTestId('push-enable')).not.toBeInTheDocument();
  });

  it('Dado permissão negada, então explica como reativar', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const device = new PushDeviceFake();
    device.permissionValue = 'denied';
    await setup(gateway, device);
    expect(screen.getByTestId('push-status')).toHaveTextContent('Reative-as nas configurações');
  });

  it('Dado push disponível, então só o clique pede permissão e assina; "Desativar" cancela', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const { fixture, device } = await setup(gateway);
    expect(device.subscribeKeys).toEqual([]);

    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(screen.getByTestId('push-disable')).toBeInTheDocument());
    expect(device.subscribeKeys).toEqual(['K']);
    expect(gateway.subscriptions).toHaveLength(1);

    await userEvent.click(screen.getByTestId('push-disable'));
    await vi.waitFor(() => expect(screen.getByTestId('push-enable')).toBeInTheDocument());
    expect(gateway.calls).toContain('unsubscribe:sub-1');
    fixture.detectChanges();
  });

  it('Dado push ativado, então recarrega as configurações e salva com a version nova', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const { fixture } = await setup(gateway);
    expect(gateway.settingsLoads).toBe(1);

    gateway.settingsValue = someSettings({ version: 4 });
    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(2));
    await fixture.whenStable();
    await userEvent.click(screen.getByTestId('notification-settings-save'));

    expect(gateway.savedSettings[0]?.version).toBe(4);
  });

  it('Dado push desativado, então recarrega as configurações', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const { device } = await setup(gateway);
    device.endpoint = 'https://push.example/abc';
    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(2));

    await userEvent.click(screen.getByTestId('push-disable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(3));
  });

  it('Dado falha ao ativar o push, então não recarrega as configurações', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const device = new PushDeviceFake();
    device.denyOnSubscribe = true;
    await setup(gateway, device);

    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(screen.getByTestId('push-status')).toHaveTextContent('Reative'));

    expect(gateway.settingsLoads).toBe(1);
  });

  it('Dado edição pendente, quando o push é ativado, então preserva o que foi digitado', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    await setup(gateway);

    await userEvent.type(screen.getByTestId('settings-display-name'), 'Ana');
    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(2));

    expect(screen.getByTestId('settings-display-name')).toHaveValue('Ana');
  });

  it('Dado edição pendente, quando o push é ativado e salva, então envia o texto digitado com a version e o push novos', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const { fixture } = await setup(gateway);

    await userEvent.type(screen.getByTestId('settings-display-name'), 'Ana');
    gateway.settingsValue = someSettings({ version: 7, push: { enabled: true } });
    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(2));
    await fixture.whenStable();
    await userEvent.click(screen.getByTestId('notification-settings-save'));

    expect(gateway.savedSettings[0]?.displayName).toBe('Ana');
    expect(gateway.savedSettings[0]?.version).toBe(7);
    expect(gateway.savedSettings[0]?.push.enabled).toBe(true);
  });

  it('Dado falha ao recarregar após o push, então mantém o formulário sem erro e sem estado oculto', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.pushConfigValue = { enabled: true, publicKey: 'K' };
    const { fixture } = await setup(gateway);

    await userEvent.type(screen.getByTestId('settings-display-name'), 'Ana');
    gateway.settingsError = aProblem(500, 'INTERNAL');
    await userEvent.click(screen.getByTestId('push-enable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(2));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('settings-display-name')).toHaveValue('Ana');
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();

    gateway.settingsError = null;
    gateway.settingsValue = someSettings({ displayName: 'Bia', version: 9 });
    await userEvent.click(screen.getByTestId('push-disable'));
    await vi.waitFor(() => expect(gateway.settingsLoads).toBe(3));
  });

  it('Dado a página, então o axe não aponta violações', async () => {
    const { container } = await setup();
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
