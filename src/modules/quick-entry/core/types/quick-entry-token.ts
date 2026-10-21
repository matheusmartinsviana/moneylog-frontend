export const QUICK_ENTRY_TOKEN_STATUSES = ['ACTIVE', 'EXPIRED', 'REVOKED'] as const;
export type QuickEntryTokenStatus = (typeof QUICK_ENTRY_TOKEN_STATUSES)[number];
export type QuickEntryTokenRevokedReason = 'USER' | 'USER_DISABLED';

export const QUICK_ENTRY_LABEL_MAX = 60;
export const QUICK_ENTRY_VALIDITY_DEFAULT_DAYS = 30;
export const QUICK_ENTRY_VALIDITY_MAX_DAYS = 90;
export const QUICK_ENTRY_VALIDITY_OPTIONS_DAYS = [7, 30, 60, 90] as const;

export interface QuickEntryToken {
  readonly id: string;
  readonly label: string;
  readonly prefix: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly status: QuickEntryTokenStatus;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly lastUsedIp: string | null;
  readonly lastUsedUserAgent: string | null;
  readonly revokedAt: string | null;
  readonly revokedReason: QuickEntryTokenRevokedReason | null;
}

export interface QuickEntryTokenInput {
  readonly label: string;
  readonly accountId: string;
  readonly expiresInDays: number;
}

export interface QuickEntryTokenCreation {
  readonly token: QuickEntryToken;
  readonly secret: string;
}

export interface QuickEntrySecret {
  readonly label: string;
  readonly value: string;
}
