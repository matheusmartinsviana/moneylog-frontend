export type DashboardFailureReason = 'forbidden' | 'unavailable';

export class DashboardFailure extends Error {
  constructor(readonly reason: DashboardFailureReason) {
    super(`Dashboard indisponível: ${reason}`);
    this.name = 'DashboardFailure';
  }
}
