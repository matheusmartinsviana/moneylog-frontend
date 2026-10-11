export const AUTH_ENDPOINTS = {
  status: '/v1/auth/status',
  setupPassword: '/v1/auth/setup-password',
  login: '/v1/auth/login',
  refresh: '/v1/auth/refresh',
  logout: '/v1/auth/logout',
} as const;
