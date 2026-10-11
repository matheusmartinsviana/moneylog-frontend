export type AuthFailureReason =
  | 'invalid_credentials'
  | 'rate_limited'
  | 'refresh_invalid'
  | 'network'
  | 'unavailable'
  | 'invalid_setup_code'
  | 'weak_password'
  | 'validation';

export class AuthFailure extends Error {
  constructor(
    readonly reason: AuthFailureReason,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`Autenticação: ${reason}`);
    this.name = 'AuthFailure';
  }
}
