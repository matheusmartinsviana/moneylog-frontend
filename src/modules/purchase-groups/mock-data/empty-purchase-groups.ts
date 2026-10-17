import type {
  PurchaseCommitmentsResponse,
  PurchaseGroupSliceResponse,
} from '~/modules/purchase-groups/infra/responses/purchase-group.response';

export const EMPTY_PURCHASE_GROUPS: PurchaseGroupSliceResponse = { items: [], hasNext: false };

export function emptyCommitments(until: string): PurchaseCommitmentsResponse {
  const zero = { amount: '0.00', currency: 'BRL' } as const;
  return { until, committed: zero, committedMine: zero, byMonth: [] };
}
