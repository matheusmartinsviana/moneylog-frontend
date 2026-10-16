import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER } from 'rxjs';

import { SubscriptionsPage } from '~/app/features/planning/pages/subscriptions.page';
import { failWith, provideAccountsStub } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aRecurrence,
  aSubscription,
  aSubscriptionRecurrence,
  aSubscriptionsPage,
  provideRecurrencesStub,
  RecurrencesGatewayStub,
} from '~/testing/recurrences-testing';
import { todayIso } from '~/util/date';

vi.setConfig({ testTimeout: 30_000 });

const brl = (amount: string) => ({ amount, currency: 'BRL' });

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

async function setup(gateway = new RecurrencesGatewayStub()) {
  const result = await render(SubscriptionsPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideRecurrencesStub(gateway),
      provideAccountsStub(),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway };
}

describe('SubscriptionsPage', () => {
  it('Dado carregando, então mostra o esqueleto com status acessível e nenhum valor', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions$ = NEVER;
    await setup(gateway);

    expect(screen.getByTestId('subscriptions-loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando as assinaturas');
    expect(screen.queryByTestId('subscriptions-totals')).not.toBeInTheDocument();
  });

  it('Dado assinaturas ativas, então pede só as ativas e mostra os totais do servidor', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      totalMonthly: brl('120.00'),
      totalMonthlyMine: brl('80.00'),
      byScope: [
        { scope: 'PERSONAL', monthly: brl('80.00') },
        { scope: 'COMPANY', monthly: brl('40.00') },
      ],
    });
    await setup(gateway);

    expect(gateway.subscriptionQueries[0]).toMatchObject({ status: 'ACTIVE' });
    expect(text(screen.getByTestId('subscriptions-total-monthly'))).toBe('R$ 120,00');
    expect(text(screen.getByTestId('subscriptions-total-mine'))).toBe('R$ 80,00');
    expect(text(screen.getByTestId('subscriptions-scope-total-COMPANY'))).toBe('R$ 40,00');
  });

  it('Dado assinatura em dólar, então mostra valor original, câmbio e IOF sem recalcular', async () => {
    await setup();

    const foreign = screen.getByTestId('subscription-foreign-sub-1');
    expect(text(foreign)).toContain('$5.00');
    expect(text(foreign)).toContain('5.000000');
    expect(text(foreign)).toContain('3,5');
    expect(text(screen.getByTestId('subscription-amount-sub-1'))).toContain('R$ 25,88');
    expect(screen.queryByTestId('subscription-monthly-sub-1')).not.toBeInTheDocument();
  });

  it('Dado assinatura da empresa, então não mostra "minha parte" e avisa que é gasto da empresa', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      items: [
        aSubscription({
          recurrence: aSubscriptionRecurrence({ id: 'sub-co', scope: 'COMPANY' }),
          monthlyEquivalentMine: brl('0.00'),
        }),
      ],
    });
    await setup(gateway);

    expect(screen.getByTestId('subscription-company-sub-co')).toHaveTextContent(
      'Gasto da empresa: fora da minha parte.',
    );
    expect(screen.queryByTestId('subscription-mine-sub-co')).not.toBeInTheDocument();
  });

  it('Dado grupos sobrepostos, então lista o grupo, os itens e o total junto', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      items: [
        aSubscription({
          recurrence: aSubscriptionRecurrence({ id: 'sub-1', overlapGroup: 'video' }),
        }),
        aSubscription({
          recurrence: aSubscriptionRecurrence({
            id: 'sub-2',
            description: 'Outro streaming',
            overlapGroup: 'video',
          }),
        }),
      ],
      overlaps: [
        {
          group: 'video',
          items: [
            { id: 'sub-1', description: 'Streaming', monthlyEquivalent: brl('25.88') },
            { id: 'sub-2', description: 'Outro streaming', monthlyEquivalent: brl('30.00') },
          ],
          monthly: brl('55.88'),
        },
      ],
    });
    await setup(gateway);

    const overlap = screen.getByTestId('subscriptions-overlap-video');
    expect(text(overlap)).toContain('Grupo video');
    expect(text(overlap)).toContain('Outro streaming');
    expect(text(overlap)).toContain('R$ 55,88');
    expect(screen.getByTestId('subscription-overlap-sub-1')).toBeInTheDocument();
    expect(screen.getByTestId('subscription-overlap-sub-2')).toBeInTheDocument();
  });

  it('Dado nenhuma assinatura, então mostra o estado vazio com a ação para recorrências', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({ items: [] });
    await setup(gateway);

    expect(screen.getByText('Nenhuma assinatura por aqui')).toBeInTheDocument();
    expect(screen.queryByTestId('subscriptions-list')).not.toBeInTheDocument();
  });

  it('Dado falha na carga, quando tento de novo, então recarrega e mostra a lista', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    gateway.subscriptions$ = null;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('subscriptions-list')).toBeInTheDocument();
  });

  it('Dado o filtro Encerradas e Empresa, então reconsulta o backend com os dois', async () => {
    const gateway = new RecurrencesGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(
      within(screen.getByTestId('subscriptions-status')).getByText('Encerradas'),
    );
    await userEvent.click(within(screen.getByTestId('subscriptions-scope')).getByText('Empresa'));
    await fixture.whenStable();

    expect(gateway.subscriptionQueries.at(-1)).toMatchObject({
      status: 'ENDED',
      scope: 'COMPANY',
    });
  });

  it('Dado assinatura cancelada com ativo até uma data, então mostra a data e não oferece cancelar de novo', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      items: [
        aSubscription({
          ended: true,
          recurrence: aSubscriptionRecurrence({
            id: 'sub-end',
            active: false,
            ended: true,
            activeUntil: '2026-12-10',
            endDate: '2026-12-10',
            nextOccurrence: null,
          }),
        }),
      ],
    });
    await setup(gateway);

    expect(screen.getByTestId('subscription-ended-sub-end')).toHaveTextContent('Cancelada');
    expect(screen.getByTestId('subscription-active-until-sub-end')).toHaveTextContent(
      'Ativa até 10 de dezembro de 2026',
    );
    expect(screen.queryByTestId('subscription-cancel-sub-end')).not.toBeInTheDocument();
    expect(screen.queryByTestId('subscription-charge-sub-end')).not.toBeInTheDocument();
  });

  it('Dado marcar como cancelada, quando confirmo a data, então envia o ativo até, avisa e recarrega', async () => {
    const gateway = new RecurrencesGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-cancel-sub-1'));
    expect(await screen.findByTestId('end-form')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('end-submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.calls).toContain(`cancel:sub-1:${todayIso()}`);
    expect(gateway.subscriptionQueries).toHaveLength(2);
    expect(screen.queryByTestId('end-form')).not.toBeInTheDocument();
  });

  it('Dado o cancelamento em andamento, então desabilita os botões e não envia duas vezes', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.next = NEVER;
    await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-cancel-sub-1'));
    await screen.findByTestId('end-form');
    await userEvent.click(screen.getByTestId('end-submit'));
    await userEvent.click(screen.getByTestId('end-submit'));

    expect(gateway.calls.filter((call) => call.startsWith('cancel:'))).toHaveLength(1);
    expect(screen.getByTestId('end-submit')).toBeDisabled();
  });

  it('Dado erro 409 ao cancelar, então mostra o erro no sheet e recarrega a lista', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.next = failWith(409, 'RECURRENCE_ENDED');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-cancel-sub-1'));
    await screen.findByTestId('end-form');
    await userEvent.click(screen.getByTestId('end-submit'));

    expect(await screen.findByTestId('end-error')).toBeInTheDocument();
    expect(gateway.subscriptionQueries.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado confirmar cobrança de assinatura em dólar, então o sheet pede valor original, câmbio e IOF', async () => {
    const gateway = new RecurrencesGatewayStub();
    await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-charge-sub-1'));

    expect(await screen.findByTestId('realize-foreign-note')).toBeInTheDocument();
    expect(screen.getByTestId('realize-original-amount')).toHaveValue('5.00');
    expect(screen.getByTestId('realize-fx-rate')).toHaveValue('5.000000');
    expect(screen.getByTestId('realize-iof')).toHaveValue('3.5');
    expect(screen.queryByTestId('realize-amount')).not.toBeInTheDocument();
  });

  it('Dado a cobrança em dólar, quando informo o câmbio do dia, então envia o valor original, o câmbio e o IOF', async () => {
    const gateway = new RecurrencesGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-charge-sub-1'));
    await screen.findByTestId('realize-foreign-note');
    await userEvent.clear(screen.getByTestId('realize-fx-rate'));
    await userEvent.type(screen.getByTestId('realize-fx-rate'), '5,40');
    await userEvent.click(screen.getByTestId('realize-submit'));
    await fixture.whenStable();

    expect(gateway.realizations).toHaveLength(1);
    expect(gateway.realizations[0]).toMatchObject({
      recurrenceId: 'sub-1',
      date: '2026-10-10',
      amount: null,
      foreign: { originalAmount: '5.00', currency: 'USD', fxRate: '5.40', iofBps: 350 },
    });
  });

  it('Dado câmbio vazio ou zero, quando confirmo, então mostra o erro no campo e não envia', async () => {
    const gateway = new RecurrencesGatewayStub();
    await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-charge-sub-1'));
    await screen.findByTestId('realize-foreign-note');
    await userEvent.clear(screen.getByTestId('realize-fx-rate'));
    await userEvent.type(screen.getByTestId('realize-fx-rate'), '0');
    await userEvent.click(screen.getByTestId('realize-submit'));

    expect(gateway.realizations).toEqual([]);
    expect(screen.getByTestId('realize-form')).toBeInTheDocument();
  });

  it('Dado confirmar cobrança de assinatura em real, então o sheet não pede câmbio', async () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      items: [
        aSubscription({
          recurrence: aSubscriptionRecurrence({
            originalAmount: null,
            referenceFxRate: null,
            iofBps: null,
          }),
        }),
      ],
    });
    await setup(gateway);

    await userEvent.click(screen.getByTestId('subscription-charge-sub-1'));

    expect(await screen.findByTestId('realize-amount')).toBeInTheDocument();
    expect(screen.queryByTestId('realize-foreign-note')).not.toBeInTheDocument();
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup(
      Object.assign(new RecurrencesGatewayStub(), { recurrences: [aRecurrence()] }),
    );

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
