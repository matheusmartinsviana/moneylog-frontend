export const QUICK_ENTRY_ENDPOINTS = {
  collection: '/v1/quick-entry-tokens',
  item: (id: string) => `/v1/quick-entry-tokens/${encodeURIComponent(id)}`,
  revoke: (id: string) => `/v1/quick-entry-tokens/${encodeURIComponent(id)}/revoke`,
} as const;
