import type {
  QuickEntryToken,
  QuickEntryTokenCreation,
  QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';
import type {
  QuickEntryTokenCreateRequest,
  QuickEntryTokenCreatedResponse,
  QuickEntryTokenResponse,
} from '~/modules/quick-entry/infra/responses/quick-entry-token.response';

export function toQuickEntryToken(response: QuickEntryTokenResponse): QuickEntryToken {
  return {
    id: response.id,
    label: response.label,
    prefix: response.prefix,
    accountId: response.accountId,
    accountName: response.accountName,
    status: response.status,
    expiresAt: response.expiresAt,
    createdAt: response.createdAt,
    lastUsedAt: response.lastUsedAt,
    lastUsedIp: response.lastUsedIp,
    lastUsedUserAgent: response.lastUsedUserAgent,
    revokedAt: response.revokedAt,
    revokedReason: response.revokedReason,
  };
}

export function toQuickEntryCreation(
  response: QuickEntryTokenCreatedResponse,
): QuickEntryTokenCreation {
  const { token, ...listed } = response;
  return { token: toQuickEntryToken(listed), secret: token };
}

export function toCreateRequest(input: QuickEntryTokenInput): QuickEntryTokenCreateRequest {
  return {
    label: input.label.trim(),
    accountId: input.accountId,
    expiresInDays: input.expiresInDays,
  };
}
