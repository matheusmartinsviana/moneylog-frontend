import type { AuthTokenResponse } from '~/modules/auth/infra/responses/auth-token.response';

export const FAKE_SESSION: AuthTokenResponse = {
  accessToken: 'mock-access-token',
  expiresAt: '2099-12-31T00:00:00Z',
  user: { id: '00000000-0000-4000-8000-000000000001', email: 'demo@moneylog.app', role: 'OWNER' },
};
