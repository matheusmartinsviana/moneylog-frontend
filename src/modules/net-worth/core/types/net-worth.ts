import type { Money } from '~/util/money';

export const NET_WORTH_CURRENCY = 'BRL';

export const MIN_TARGET_MONTHS = 1;
export const MAX_TARGET_MONTHS = 60;

export interface EmergencyReserve {
  readonly amount: Money;
  readonly monthlyBase: Money;
  readonly coverageMonths: string | null;
  readonly targetMonths: number | null;
  readonly targetAmount: Money | null;
  readonly missingToTarget: Money | null;
}

export interface NetWorthOverview {
  readonly availableCash: Money;
  readonly availableAssets: Money;
  readonly reservedAssets: Money;
  readonly receivablesPending: Money;
  readonly debts: Money;
  readonly emergencyReserve: EmergencyReserve;
}

export function isValidTargetMonths(value: number | null): value is number {
  return (
    value !== null &&
    Number.isInteger(value) &&
    value >= MIN_TARGET_MONTHS &&
    value <= MAX_TARGET_MONTHS
  );
}
