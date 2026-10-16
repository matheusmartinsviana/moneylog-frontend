export const COMMITMENT_ENDPOINTS = {
  collection: '/v1/commitments',
  byId: (id: string) => `/v1/commitments/${encodeURIComponent(id)}`,
  pay: (id: string, position: number) =>
    `/v1/commitments/${encodeURIComponent(id)}/schedule/${position}/pay`,
  shares: (id: string, position: number) =>
    `/v1/commitments/${encodeURIComponent(id)}/schedule/${position}/shares`,
  clauses: (id: string) => `/v1/commitments/${encodeURIComponent(id)}/clauses`,
  byPerson: (id: string) => `/v1/commitments/${encodeURIComponent(id)}/by-person`,
  progress: (id: string) => `/v1/commitments/${encodeURIComponent(id)}/progress`,
} as const;
