export type UserRole = 'OWNER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type InvitationDeliveryStatus = 'SENT' | 'FAILED';

export interface ManagedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly createdAt: string;
  readonly lastLoginAt: string | null;
}

export interface Invitation {
  readonly id: string;
  readonly email: string;
  readonly status: InvitationStatus;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly acceptedAt: string | null;
  readonly lastSentAt: string;
  readonly deliveryStatus: InvitationDeliveryStatus;
}
