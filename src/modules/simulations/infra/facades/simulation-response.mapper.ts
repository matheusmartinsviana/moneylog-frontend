import type {
  PurchaseSimulation,
  PurchaseSimulationInput,
  SimulationMonth,
} from '~/modules/simulations/core/types/simulation';
import type {
  PurchaseSimulationRequest,
  PurchaseSimulationResponse,
} from '~/modules/simulations/infra/responses/simulation.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

const optionalMoney = (value: { amount: string; currency: string } | null | undefined) =>
  value ? money(value) : null;

const toMonth = (month: PurchaseSimulationResponse['months'][number]): SimulationMonth => ({
  competence: month.competence,
  surplusBefore: money(month.surplusBefore),
  surplusAfter: money(month.surplusAfter),
  delta: money(month.delta),
  negativeAfter: month.negativeAfter,
  cutsMonthly: optionalMoney(month.cutsMonthly),
  surplusAfterWithCuts: optionalMoney(month.surplusAfterWithCuts),
  negativeAfterWithCuts: month.negativeAfterWithCuts ?? null,
  estimated: month.confidence === 'ESTIMATED',
});

export function toPurchaseSimulation(response: PurchaseSimulationResponse): PurchaseSimulation {
  return {
    installmentAmount: money(response.installmentAmount),
    total: money(response.total),
    months: response.months.map(toMonth),
    horizon: { ...response.horizon },
    classification: response.classification,
    reasons: response.reasons.map((reason) => ({
      code: reason.code,
      competence: reason.competence,
      params: { ...reason.params },
    })),
    endBalanceMin: money(response.endBalanceMin),
    endBalanceMinWithCuts: optionalMoney(response.endBalanceMinWithCuts),
    financingWarning: response.financingWarning,
  };
}

export function toPurchaseSimulationRequest(
  input: PurchaseSimulationInput,
): PurchaseSimulationRequest {
  return {
    amount: input.amount,
    installments: input.installments,
    interestRatePerMonthBps: input.interestRatePerMonthBps,
    firstInstallmentMonth: input.firstInstallmentMonth,
    ...(input.cancelSubscriptionIds.length > 0
      ? { cancelSubscriptionIds: [...input.cancelSubscriptionIds] }
      : {}),
  };
}
