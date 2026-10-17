export const TRANSACTIONS_ENDPOINTS = {
  collection: '/v1/transactions',
  item: (id: string) => `/v1/transactions/${encodeURIComponent(id)}`,
  void: (id: string) => `/v1/transactions/${encodeURIComponent(id)}/void`,
  cancelInstallments: (id: string) =>
    `/v1/transactions/${encodeURIComponent(id)}/cancel-installments`,
  shares: (id: string) => `/v1/transactions/${encodeURIComponent(id)}/shares`,
  entries: '/v1/entries',
} as const;

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
