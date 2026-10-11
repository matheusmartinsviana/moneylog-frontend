import type { AuthTokenResponse } from '~/modules/auth/infra/responses/auth-token.response';

export const FAKE_SESSION: AuthTokenResponse = {
  accessToken: 'mock-access-token',
  expiresAt: '2099-12-31T00:00:00Z',
};
