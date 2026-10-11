import type { Money } from '~/util/money';

export const GOAL_CURRENCY = 'BRL';

export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export const GOAL_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const satisfies readonly GoalPriority[];

export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'ARCHIVED';
export const GOAL_STATUSES = [
  'ACTIVE',
  'ACHIEVED',
  'ARCHIVED',
] as const satisfies readonly GoalStatus[];

export type GoalKind = 'SAVINGS' | 'DEBT_PAYOFF' | 'METRIC';

export type GoalMetric =
  | 'TOTAL_DEBT'
  | 'CARD_DEBT'
  | 'PEOPLE_DEBT'
  | 'OTHER_DEBT'
  | 'ACCOUNTS_BALANCE'
  | 'AVAILABLE_BALANCE'
  | 'FIXED_COSTS_MONTHLY';
export const GOAL_METRICS = [
  'TOTAL_DEBT',
  'CARD_DEBT',
  'PEOPLE_DEBT',
  'OTHER_DEBT',
  'ACCOUNTS_BALANCE',
  'AVAILABLE_BALANCE',
  'FIXED_COSTS_MONTHLY',
] as const satisfies readonly GoalMetric[];

export type GoalDirection = 'DECREASE' | 'INCREASE';

export type GoalStage = 'FANTASY' | 'OBJECTIVE' | 'STRATEGY' | 'CONSISTENT' | 'ACHIEVED';
export const GOAL_STAGES = [
  'FANTASY',
  'OBJECTIVE',
  'STRATEGY',
  'CONSISTENT',
  'ACHIEVED',
] as const satisfies readonly GoalStage[];

export type GoalActionFrequency = 'MONTHLY' | 'WEEKLY' | 'ONE_TIME';
export const GOAL_ACTION_FREQUENCIES = [
  'MONTHLY',
  'WEEKLY',
  'ONE_TIME',
] as const satisfies readonly GoalActionFrequency[];
export const GOAL_ACTION_MAX = 10;
export const GOAL_PLAN_NOTE_MAX = 500;

export interface GoalAction {
  readonly id: string;
  readonly title: string;
  readonly frequency: GoalActionFrequency;
  readonly doneIn: readonly string[];
}

export interface GoalActionInput {
  readonly title: string;
  readonly frequency: GoalActionFrequency;
}

export interface GoalConsistencyMonth {
  readonly month: string;
  readonly expected: Money;
  readonly actual: Money | null;
  readonly met: boolean | null;
  readonly closed: boolean;
}

export interface Ref {
  readonly id: string;
  readonly name: string;
}

export interface GoalReservation {
  readonly id: string;
  readonly account: Ref;
  readonly amount: Money;
  readonly date: string;
  readonly note: string | null;
  readonly createdAt: string;
}

export const GOAL_PHOTO_MAX = 8;
export const GOAL_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const GOAL_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;
export const GOAL_PHOTO_ACCEPT = '.jpg,.jpeg,.png';

export interface GoalPhoto {
  readonly id: string;
  readonly position: number;
  readonly width: number;
  readonly height: number;
  readonly createdAt: string;
}

export type GoalPhotoVariant = 'thumb' | 'display';

export interface Goal {
  readonly id: string;
  readonly kind: GoalKind;
  readonly name: string | null;
  readonly target: Money;
  readonly current: Money | null;
  readonly progress: string;
  readonly remaining: Money | null;
  readonly status: GoalStatus;
  readonly deadline: string | null;
  readonly priority: GoalPriority;
  readonly description: string | null;
  readonly monthlyNeeded: Money | null;
  readonly uncovered: boolean;
  readonly reservations: readonly GoalReservation[];
  readonly baselineSet: boolean;
  readonly baseline: Money | null;
  readonly grewSinceBaseline: boolean;
  readonly metric: GoalMetric | null;
  readonly direction: GoalDirection | null;
  readonly reached: boolean;
  readonly metricAsOf: string | null;
  readonly stage: GoalStage;
  readonly requiredPace: Money | null;
  readonly monthsLeft: number | null;
  readonly nextMilestone: Money | null;
  readonly onTrack: boolean | null;
  readonly gap: Money | null;
  readonly planNote: string | null;
  readonly actions: readonly GoalAction[];
  readonly consistency: readonly GoalConsistencyMonth[];
  readonly streak: number;
  readonly consistencyRate: string | null;
  readonly version: number;
  readonly featured: boolean;
  readonly coverPhotoId: string | null;
  readonly photos: readonly GoalPhoto[];
}

export interface GoalInput {
  readonly kind?: GoalKind;
  readonly metric?: GoalMetric;
  readonly name: string;
  readonly target: string;
  readonly deadline: string | null;
  readonly priority?: GoalPriority;
  readonly description: string | null;
}

export interface GoalUpdate extends GoalInput {
  readonly planNote: string | null;
  readonly version: number;
}

export interface ReservationInput {
  readonly kind: 'reserve' | 'release';
  readonly accountId: string;
  readonly amount: string;
  readonly date: string;
  readonly note: string | null;
}
