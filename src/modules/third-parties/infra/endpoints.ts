export const THIRD_PARTY_ENDPOINTS = {
  receivables: '/v1/debts/third-party-receivables',
  expenses: '/v1/third-party-expenses',
  receipts: '/v1/third-party-receipts',
  receipt: (id: string) => `/v1/third-party-receipts/${encodeURIComponent(id)}`,
} as const;
