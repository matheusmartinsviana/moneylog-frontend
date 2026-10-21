export type UserRole = 'OWNER' | 'MEMBER';

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface AuthToken {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly user: SessionUser;
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface InvitationPreview {
  readonly email: string;
  readonly expiresAt: string;
  readonly invitedByName: string | null;
}

export interface AcceptInvitationInput {
  readonly token: string;
  readonly password: string;
}

export interface SetupPasswordInput {
  readonly email: string;
  readonly setupCode: string;
  readonly newPassword: string;
}
