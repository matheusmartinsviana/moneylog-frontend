export interface AuthToken {
  readonly accessToken: string;
  readonly expiresAt: string;
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface SetupPasswordInput {
  readonly email: string;
  readonly setupCode: string;
  readonly newPassword: string;
}
