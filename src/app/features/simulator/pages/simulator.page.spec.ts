import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { SimulatorPage } from '~/app/features/simulator/pages/simulator.page';
import { failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aSubscription,
  aSubscriptionRecurrence,
  aSubscriptionsPage,
  provideRecurrencesStub,
  RecurrencesGatewayStub,
} from '~/testing/recurrences-testing';
import {
  aSimulation,
  aSimulationMonth,
  provideSimulationsStub,
  SimulationsGatewayStub,
} from '~/testing/simulations-testing';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

async function setup(
  gateway = new SimulationsGatewayStub(),
  recurrences = new RecurrencesGatewayStub(),
) {
  const result = await render(SimulatorPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideSimulationsStub(gateway),
      provideRecurrencesStub(recurrences),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway, recurrences };
}

const input = (id: string) => screen.getByTestId(id) as HTMLInputElement;

async function fillAndSimulate(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await userEvent.clear(input('simulator-amount'));
  await userEvent.type(input('simulator-amount'), '1.200,00');
  await userEvent.clear(input('simulator-installments'));
  await userEvent.type(input('simulator-installments'), '6');
  await userEvent.click(screen.getByTestId('simulator-submit'));
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('SimulatorPage', () => {
  it('Dado que ainda não simulei, então mostra o estado vazio e não chama a API', async () => {
    const { gateway } = await setup();

    expect(screen.getByText('Faça uma simulação.')).toBeInTheDocument();
    expect(gateway.inputs).toEqual([]);
  });

  it('Dado valor e parcelas, quando simulo, então envia o pedido e mostra o que o backend devolveu', async () => {
    const gateway = new SimulationsGatewayStub();
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(gateway.inputs).toHaveLength(1);
    expect(gateway.inputs[0]).toMatchObject({
      amount: '1200.00',
      installments: 6,
      interestRatePerMonthBps: 0,
      cancelSubscriptionIds: [],
    });
    expect(screen.getByTestId('simulator-classification')).toHaveAttribute(
      'data-classification',
      'SUSTAINABLE',
    );
    expect(screen.getByTestId('simulator-classification-label')).toHaveTextContent(
      'Cabe no seu mês',
    );
    expect(screen.getByTestId('simulator-installment')).toHaveTextContent('200,00');
  });

  it('Dado juros em porcentagem, então envia em pontos-base', async () => {
    const gateway = new SimulationsGatewayStub();
    const { fixture } = await setup(gateway);
    await userEvent.type(input('simulator-interest'), '1,99');

    await fillAndSimulate(fixture);

    expect(gateway.inputs[0]?.interestRatePerMonthBps).toBe(199);
  });

  it('Dado campos vazios, quando simulo, então mostra os erros e não chama a API', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('simulator-submit'));
    fixture.detectChanges();

    expect(gateway.inputs).toEqual([]);
    expect(input('simulator-amount')).toHaveAttribute('aria-invalid', 'true');
  });

  it('Dado assinaturas ativas, quando marco uma para cancelar, então o pedido leva só o id dela', async () => {
    const recurrences = new RecurrencesGatewayStub();
    recurrences.subscriptions = aSubscriptionsPage({
      items: [
        aSubscription({
          recurrence: aSubscriptionRecurrence({ id: 'sub-1', description: 'Streaming' }),
        }),
        aSubscription({
          recurrence: aSubscriptionRecurrence({ id: 'sub-2', description: 'Música' }),
        }),
      ],
    });
    const gateway = new SimulationsGatewayStub();
    const { fixture } = await setup(gateway, recurrences);

    await userEvent.click(screen.getByTestId('simulator-cut-sub-2'));
    await fillAndSimulate(fixture);

    expect(gateway.inputs[0]?.cancelSubscriptionIds).toEqual(['sub-2']);
  });

  it('Dado que não há assinaturas ativas, então avisa que não há o que compensar', async () => {
    const recurrences = new RecurrencesGatewayStub();
    recurrences.subscriptions = aSubscriptionsPage({ items: [] });
    await setup(new SimulationsGatewayStub(), recurrences);

    expect(screen.getByTestId('simulator-cuts-empty')).toBeInTheDocument();
  });

  it('Dado horizonte limitado e financiamento pendente, então mostra os dois avisos e o limite da análise', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = of(
      aSimulation({
        classification: 'RISKY',
        horizon: {
          from: '2026-11',
          to: '2027-10',
          calculatedMonths: 12,
          requiredMonths: 18,
          limited: true,
        },
        financingWarning: true,
        reasons: [
          { code: 'HORIZON_LIMITED', competence: null, params: {} },
          { code: 'FINANCING_PENDING', competence: null, params: {} },
        ],
      }),
    );
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-horizon-warning')).toHaveTextContent('12 de 18 meses');
    expect(screen.getByTestId('simulator-financing-warning')).toBeInTheDocument();
    expect(screen.getByTestId('simulator-classification-label')).toHaveTextContent(
      'Cabe, com cautela',
    );
  });

  it('Dado a resposta com mês negativo e cortes, então mostra a sobra com os cortes e marca o mês', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = of(
      aSimulation({
        classification: 'VIABLE_WITH_PLANNING',
        months: [
          aSimulationMonth({
            surplusAfter: brl('-50.00'),
            negativeAfter: true,
            cutsMonthly: brl('60.00'),
            surplusAfterWithCuts: brl('10.00'),
            negativeAfterWithCuts: false,
          }),
        ],
        endBalanceMinWithCuts: brl('10.00'),
        reasons: [{ code: 'NEGATIVE_FIXED_WITH_CUTS', competence: null, params: {} }],
      }),
    );
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-classification-label')).toHaveTextContent(
      'Cabe com ajuste',
    );
    expect(screen.getByTestId('simulator-month-2026-11')).toHaveTextContent('Negativa');
    expect(screen.getByTestId('simulator-min-balance-cuts')).toHaveTextContent('10,00');
  });

  it('Dado classificação INCOMPATIBLE, então diz que não cabe e explica o mês que continua negativo', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = of(
      aSimulation({
        classification: 'INCOMPATIBLE',
        months: [
          aSimulationMonth({
            surplusAfter: brl('-300.00'),
            negativeAfter: true,
            cutsMonthly: brl('60.00'),
            surplusAfterWithCuts: brl('-240.00'),
            negativeAfterWithCuts: true,
          }),
        ],
        reasons: [{ code: 'NEGATIVE_EVEN_WITH_CUTS', competence: '2026-11', params: {} }],
      }),
    );
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-classification')).toHaveAttribute(
      'data-classification',
      'INCOMPATIBLE',
    );
    expect(screen.getByTestId('simulator-classification-label')).toHaveTextContent(
      'Não cabe agora',
    );
    expect(screen.getByTestId('simulator-reason')).toHaveTextContent(
      'Em novembro de 2026 a sobra continua negativa mesmo com os cortes.',
    );
  });

  it('Dado a conclusão RISKY por renda estimada, então mostra o motivo e a nota de meses estimados', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = of(
      aSimulation({
        classification: 'RISKY',
        months: [aSimulationMonth({ estimated: true })],
        reasons: [{ code: 'ESTIMATED_INCOME_NEEDED', competence: null, params: {} }],
      }),
    );
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-reason')).toHaveTextContent(
      'A sobra só fica positiva contando renda estimada.',
    );
    expect(screen.getByTestId('simulator-estimated-note')).toBeInTheDocument();
  });

  it('Dado um motivo que o front não conhece, então mostra a observação genérica em vez de quebrar', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = of(
      aSimulation({ reasons: [{ code: 'MOTIVO_NOVO', competence: null, params: {} }] }),
    );
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-reason')).toHaveTextContent(
      'Há uma observação sobre esta simulação.',
    );
  });

  it('Dado horizonte completo, então não mostra o aviso de cálculo parcial', async () => {
    const { fixture } = await setup();

    await fillAndSimulate(fixture);

    expect(screen.queryByTestId('simulator-horizon-warning')).not.toBeInTheDocument();
    expect(screen.queryByTestId('simulator-financing-warning')).not.toBeInTheDocument();
  });

  it('Dado 401 do backend, então mostra o erro com tentar de novo e nenhum resultado', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = failWith(401, 'UNAUTHORIZED');
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator-result')).not.toBeInTheDocument();
  });

  it('Dado erro 422, então mostra o erro com tentar de novo', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = failWith(422, 'SIMULATION_INVALID');
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('error-state')).toHaveTextContent('Não foi possível simular');
    expect(screen.getByTestId('empty-state-action-retry')).toBeInTheDocument();
  });

  it('Dado a simulação em andamento, então desabilita o botão', async () => {
    const gateway = new SimulationsGatewayStub();
    gateway.result$ = NEVER;
    const { fixture } = await setup(gateway);

    await fillAndSimulate(fixture);

    expect(screen.getByTestId('simulator-submit')).toBeDisabled();
    expect(screen.getByTestId('simulator-loading')).toBeInTheDocument();
  });

  it('Dado a tela, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);

    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
