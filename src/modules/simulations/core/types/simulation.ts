import type { Money } from '~/util/money';

export type SimulationClassification =
  'SUSTAINABLE' | 'VIABLE_WITH_PLANNING' | 'RISKY' | 'INCOMPATIBLE';

export interface PurchaseSimulationInput {
  readonly amount: string;
  readonly installments: number;
  readonly interestRatePerMonthBps: number;
  readonly firstInstallmentMonth: string;
  readonly cancelSubscriptionIds: readonly string[];
}

export interface SimulationReason {
  readonly code: string;
  readonly competence: string | null;
  readonly params: Readonly<Record<string, string>>;
}

export interface SimulationHorizon {
  readonly from: string;
  readonly to: string;
  readonly calculatedMonths: number;
  readonly requiredMonths: number;
  readonly limited: boolean;
}

export interface SimulationMonth {
  readonly competence: string;
  readonly surplusBefore: Money;
  readonly surplusAfter: Money;
  readonly delta: Money;
  readonly negativeAfter: boolean;
  readonly cutsMonthly: Money | null;
  readonly surplusAfterWithCuts: Money | null;
  readonly negativeAfterWithCuts: boolean | null;
  readonly estimated: boolean;
}

export interface PurchaseSimulation {
  readonly installmentAmount: Money;
  readonly total: Money;
  readonly months: readonly SimulationMonth[];
  readonly horizon: SimulationHorizon;
  readonly classification: SimulationClassification;
  readonly reasons: readonly SimulationReason[];
  readonly endBalanceMin: Money;
  readonly endBalanceMinWithCuts: Money | null;
  readonly financingWarning: boolean;
}
