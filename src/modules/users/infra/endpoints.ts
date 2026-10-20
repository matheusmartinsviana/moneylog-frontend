export const USERS_ENDPOINTS = {
  list: '/v1/users',
  disable: (id: string) => `/v1/users/${encodeURIComponent(id)}/disable`,
  enable: (id: string) => `/v1/users/${encodeURIComponent(id)}/enable`,
} as const;

export const INVITATIONS_ENDPOINTS = {
  collection: '/v1/invitations',
  resend: (id: string) => `/v1/invitations/${encodeURIComponent(id)}/resend`,
  item: (id: string) => `/v1/invitations/${encodeURIComponent(id)}`,
} as const;
