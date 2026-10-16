export const ASSETS_ENDPOINTS = {
  collection: '/v1/assets',
  item: (id: string) => `/v1/assets/${encodeURIComponent(id)}`,
  balance: (id: string) => `/v1/assets/${encodeURIComponent(id)}/balance`,
} as const;
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
