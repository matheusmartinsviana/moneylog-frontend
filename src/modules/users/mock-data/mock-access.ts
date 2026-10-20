import type { Invitation, ManagedUser } from '~/modules/users/core/types/access';

export const MOCK_USERS: readonly ManagedUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'demo@moneylog.app',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: '2026-01-10T12:00:00Z',
    lastLoginAt: '2026-10-19T09:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'convidado@moneylog.app',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-10-12T12:00:00Z',
    lastLoginAt: null,
  },
];

export const MOCK_INVITATIONS: readonly Invitation[] = [
  {
    id: '00000000-0000-4000-8000-0000000000a1',
    email: 'novo@moneylog.app',
    status: 'PENDING',
    createdAt: '2026-10-18T12:00:00Z',
    expiresAt: '2026-10-25T12:00:00Z',
    acceptedAt: null,
    lastSentAt: '2026-10-18T12:00:00Z',
    deliveryStatus: 'SENT',
  },
];

export function mockInvitationFor(email: string): Invitation {
  return {
    id: '00000000-0000-4000-8000-0000000000a2',
    email,
    status: 'PENDING',
    createdAt: '2026-10-19T12:00:00Z',
    expiresAt: '2026-10-26T12:00:00Z',
    acceptedAt: null,
    lastSentAt: '2026-10-19T12:00:00Z',
    deliveryStatus: 'SENT',
  };
}
