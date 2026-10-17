import {
  toPurchaseSimulation,
  toPurchaseSimulationRequest,
} from '~/modules/simulations/infra/facades/simulation-response.mapper';
import type { PurchaseSimulationResponse } from '~/modules/simulations/infra/responses/simulation.response';

const brl = (amount: string) => ({ amount, currency: 'BRL' as const });

const response: PurchaseSimulationResponse = {
  installmentAmount: brl('200.00'),
  total: brl('1200.00'),
  months: [
    {
      competence: '2026-11',
      surplusBefore: brl('150.00'),
      surplusAfter: brl('-50.00'),
      delta: brl('-200.00'),
      negativeAfter: true,
      cutsMonthly: brl('60.00'),
      surplusAfterWithCuts: brl('10.00'),
      negativeAfterWithCuts: false,
      confidence: 'ESTIMATED',
    },
  ],
  horizon: {
    from: '2026-11',
    to: '2027-10',
    calculatedMonths: 12,
    requiredMonths: 18,
    limited: true,
  },
  classification: 'RISKY',
  reasons: [{ code: 'HORIZON_LIMITED', competence: null, params: { months: '12' } }],
  endBalanceMin: brl('-50.00'),
  endBalanceMinWithCuts: brl('10.00'),
  financingWarning: true,
};

describe('mapper da simulação de compra', () => {
  it('Dado a resposta, então mantém os valores do backend e marca o mês estimado', () => {
    const simulation = toPurchaseSimulation(response);

    expect(simulation.months[0]?.surplusAfter).toEqual(brl('-50.00'));
    expect(simulation.months[0]?.estimated).toBe(true);
    expect(simulation.months[0]?.surplusAfterWithCuts).toEqual(brl('10.00'));
    expect(simulation.horizon.limited).toBe(true);
    expect(simulation.classification).toBe('RISKY');
    expect(simulation.financingWarning).toBe(true);
    expect(simulation.endBalanceMinWithCuts).toEqual(brl('10.00'));
  });

  it('Dado sem cortes, então os campos de corte ficam nulos', () => {
    const simulation = toPurchaseSimulation({
      ...response,
      months: [
        {
          ...response.months[0]!,
          cutsMonthly: null,
          surplusAfterWithCuts: null,
          negativeAfterWithCuts: null,
        },
      ],
      endBalanceMinWithCuts: null,
    });

    expect(simulation.months[0]?.cutsMonthly).toBeNull();
    expect(simulation.months[0]?.negativeAfterWithCuts).toBeNull();
    expect(simulation.endBalanceMinWithCuts).toBeNull();
  });

  it('Dado o pedido sem cortes, então não envia cancelSubscriptionIds', () => {
    const request = toPurchaseSimulationRequest({
      amount: '1200.00',
      installments: 6,
      interestRatePerMonthBps: 199,
      firstInstallmentMonth: '2026-11',
      cancelSubscriptionIds: [],
    });

    expect(request).toEqual({
      amount: '1200.00',
      installments: 6,
      interestRatePerMonthBps: 199,
      firstInstallmentMonth: '2026-11',
    });
  });

  it('Dado cortes, então envia só os ids escolhidos', () => {
    const request = toPurchaseSimulationRequest({
      amount: '1200.00',
      installments: 6,
      interestRatePerMonthBps: 0,
      firstInstallmentMonth: '2026-11',
      cancelSubscriptionIds: ['a', 'b'],
    });

    expect(request.cancelSubscriptionIds).toEqual(['a', 'b']);
  });
});
