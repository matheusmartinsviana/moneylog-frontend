import type { AuthTokenResponse } from '~/modules/auth/infra/responses/auth-token.response';

export const FAKE_SESSION: AuthTokenResponse = {
  accessToken: 'mock-access-token',
  expiresAt: '2099-12-31T00:00:00Z',
  user: { id: '00000000-0000-4000-8000-000000000001', email: 'demo@moneylog.app', role: 'OWNER' },
};

export const FAKE_MEMBER_SESSION: AuthTokenResponse = {
  accessToken: 'mock-member-access-token',
  expiresAt: '2099-12-31T00:00:00Z',
  user: {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'convidado@moneylog.app',
    role: 'MEMBER',
  },
};

export const FAKE_INVITATION_PREVIEW = {
  email: 'convidado@moneylog.app',
  expiresAt: '2099-12-31T00:00:00Z',
};
