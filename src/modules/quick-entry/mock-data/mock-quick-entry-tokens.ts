import type {
  QuickEntryToken,
  QuickEntryTokenCreation,
} from '~/modules/quick-entry/core/types/quick-entry-token';

export const MOCK_QUICK_ENTRY_TOKENS: readonly QuickEntryToken[] = [
  {
    id: '00000000-0000-4000-8000-0000000000b1',
    label: 'iPhone do Matheus',
    prefix: 'Ab3dE9xK',
    accountId: '00000000-0000-4000-8000-0000000000c1',
    accountName: 'Carteira',
    status: 'ACTIVE',
    expiresAt: '2026-11-20T12:00:00Z',
    createdAt: '2026-10-21T12:00:00Z',
    lastUsedAt: null,
    lastUsedIp: null,
    lastUsedUserAgent: null,
    revokedAt: null,
    revokedReason: null,
  },
];

export const MOCK_QUICK_ENTRY_SECRET = 'mlq_Ab3dE9xK_EXEMPLO-FICTICIO-SEM-VALOR-0000000000000000';

export function mockQuickEntryCreation(label: string): QuickEntryTokenCreation {
  return {
    token: { ...MOCK_QUICK_ENTRY_TOKENS[0]!, id: '00000000-0000-4000-8000-0000000000b2', label },
    secret: MOCK_QUICK_ENTRY_SECRET,
  };
}
