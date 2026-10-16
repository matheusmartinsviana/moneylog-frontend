import type { NetWorthOverviewResponse } from '~/modules/net-worth/infra/responses/net-worth.response';

const ZERO = { amount: '0.00', currency: 'BRL' } as const;

export const EMPTY_NET_WORTH: NetWorthOverviewResponse = {
  availableCash: ZERO,
  availableAssets: ZERO,
  reservedAssets: ZERO,
  receivablesPending: ZERO,
  debts: ZERO,
  emergencyReserve: {
    amount: ZERO,
    monthlyBase: ZERO,
    coverageMonths: null,
    targetMonths: null,
    targetAmount: null,
    missingToTarget: null,
  },
};
