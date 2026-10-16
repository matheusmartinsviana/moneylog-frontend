export const INCOME_ENDPOINTS = {
  profiles: '/v1/income-profiles',
  profile: (id: string) => `/v1/income-profiles/${encodeURIComponent(id)}`,
  archive: (id: string) => `/v1/income-profiles/${encodeURIComponent(id)}/archive`,
  preview: (id: string) => `/v1/income-profiles/${encodeURIComponent(id)}/preview`,
  generate: (id: string) => `/v1/income-profiles/${encodeURIComponent(id)}/generate-occurrences`,
  taxTables: '/v1/tax-tables',
} as const;
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
