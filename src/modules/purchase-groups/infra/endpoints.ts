export const PURCHASE_GROUPS_ENDPOINTS = {
  collection: '/v1/purchase-groups',
  commitments: '/v1/purchase-groups/commitments',
  item: (id: string) => `/v1/purchase-groups/${encodeURIComponent(id)}`,
  members: (id: string) => `/v1/purchase-groups/${encodeURIComponent(id)}/members`,
  member: (id: string, transactionId: string) =>
    `/v1/purchase-groups/${encodeURIComponent(id)}/members/${encodeURIComponent(transactionId)}`,
} as const;
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
