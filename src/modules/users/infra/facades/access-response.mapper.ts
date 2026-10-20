import type { Invitation, ManagedUser } from '~/modules/users/core/types/access';
import type {
  InvitationResponse,
  ManagedUserResponse,
} from '~/modules/users/infra/responses/access.response';

export function toManagedUser(response: ManagedUserResponse): ManagedUser {
  return {
    id: response.id,
    email: response.email,
    role: response.role,
    status: response.status,
    createdAt: response.createdAt,
    lastLoginAt: response.lastLoginAt ?? null,
  };
}

export function toInvitation(response: InvitationResponse): Invitation {
  return {
    id: response.id,
    email: response.email,
    status: response.status,
    createdAt: response.createdAt,
    expiresAt: response.expiresAt,
    acceptedAt: response.acceptedAt ?? null,
    lastSentAt: response.lastSentAt,
    deliveryStatus: response.deliveryStatus,
  };
}
