import type { Money } from '~/util/money';

export type ProjectionHorizon = 'D30' | 'D90' | 'M6' | 'M12';
export const PROJECTION_HORIZONS = [
  'D30',
  'D90',
  'M6',
  'M12',
] as const satisfies readonly ProjectionHorizon[];

export const DEFAULT_HORIZON: ProjectionHorizon = 'M6';

export interface ProjectionQuery {
  readonly horizon: ProjectionHorizon;
  readonly includeTrend: boolean;
}

export interface ProjectionPoint {
  readonly competence: string;
  readonly periodEnd: string;
  readonly inflows: Money;
  readonly outflows: Money;
  readonly balance: Money;
}

export interface ProjectionGoalInfo {
  readonly goalId: string;
  readonly name: string;
  readonly current: Money;
  readonly target: Money;
}

export interface ProjectionGoals {
  readonly reserved: Money;
  readonly items: readonly ProjectionGoalInfo[];
}

export interface ProjectionTrendPoint {
  readonly competence: string;
  readonly estimatedSpending: Money;
  readonly balance: Money;
}

export interface ProjectionTrend {
  readonly available: boolean;
  readonly estimate: boolean;
  readonly reason: string | null;
  readonly monthlyAverage: Money | null;
  readonly basedOn: readonly string[];
  readonly series: readonly ProjectionTrendPoint[];
}

export interface Projection {
  readonly isProjection: true;
  readonly horizon: ProjectionHorizon;
  readonly asOf: string;
  readonly startingBalance: Money;
  readonly series: readonly ProjectionPoint[];
  readonly assumptions: readonly string[];
  readonly goals: ProjectionGoals;
  readonly trend: ProjectionTrend | null;
}
