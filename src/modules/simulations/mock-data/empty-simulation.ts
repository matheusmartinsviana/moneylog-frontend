import type { PurchaseSimulationInput } from '~/modules/simulations/core/types/simulation';
import type { PurchaseSimulationResponse } from '~/modules/simulations/infra/responses/simulation.response';

const zero = { amount: '0.00', currency: 'BRL' as const };

export function emptyPurchaseSimulation(
  input: PurchaseSimulationInput,
): PurchaseSimulationResponse {
  return {
    installmentAmount: zero,
    total: zero,
    months: [],
    horizon: {
      from: input.firstInstallmentMonth,
      to: input.firstInstallmentMonth,
      calculatedMonths: 0,
      requiredMonths: input.installments,
      limited: false,
    },
    classification: 'SUSTAINABLE',
    reasons: [],
    endBalanceMin: zero,
    endBalanceMinWithCuts: null,
    financingWarning: false,
  };
}
