export const DEBT_OVERVIEW_ENDPOINTS = {
  overview: '/v1/debts/overview',
  ongoing: (cardId: string) => `/v1/cards/${encodeURIComponent(cardId)}/ongoing-installments`,
  ongoingPreview: (cardId: string) =>
    `/v1/cards/${encodeURIComponent(cardId)}/ongoing-installments/preview`,
} as const;
