import type {
  Frequency,
  IntervalUnit,
  Ref,
  RecurrenceType,
} from '~/modules/recurrences/core/types/recurrence';
import type { Money } from '~/util/money';

export const SUBSCRIPTION_CURRENCY = 'BRL';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export type RecurrenceScope = 'PERSONAL' | 'COMPANY';
export const RECURRENCE_SCOPES = [
  'PERSONAL',
  'COMPANY',
] as const satisfies readonly RecurrenceScope[];

export type SubscriptionStatusFilter = 'ACTIVE' | 'ENDED' | 'ALL';
export const SUBSCRIPTION_STATUS_FILTERS = [
  'ACTIVE',
  'ENDED',
  'ALL',
] as const satisfies readonly SubscriptionStatusFilter[];

export interface ForeignAmount {
  readonly amount: string;
  readonly currency: CurrencyCode;
}

export interface SubscriptionRecurrence {
  readonly id: string;
  readonly type: RecurrenceType;
  readonly amount: Money;
  readonly description: string | null;
  readonly category: Ref;
  readonly account: Ref | null;
  readonly card: Ref | null;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly unit: IntervalUnit | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly activeUntil: string | null;
  readonly active: boolean;
  readonly ended: boolean;
  readonly nextOccurrence: string | null;
  readonly scope: RecurrenceScope;
  readonly channel: string | null;
  readonly overlapGroup: string | null;
  readonly lastUsedOn: string | null;
  readonly originalAmount: ForeignAmount | null;
  readonly referenceFxRate: string | null;
  readonly iofBps: number | null;
  readonly version: number;
}

export interface Subscription {
  readonly recurrence: SubscriptionRecurrence;
  readonly monthlyEquivalent: Money;
  readonly monthlyEquivalentMine: Money;
  readonly lastChargedAmount: Money | null;
  readonly ended: boolean;
}

export interface SubscriptionScopeTotal {
  readonly scope: RecurrenceScope;
  readonly monthly: Money;
}

export interface SubscriptionOverlapItem {
  readonly id: string;
  readonly description: string | null;
  readonly monthlyEquivalent: Money;
}

export interface SubscriptionOverlap {
  readonly group: string;
  readonly items: readonly SubscriptionOverlapItem[];
  readonly monthly: Money;
}

export interface SubscriptionsOverview {
  readonly items: readonly Subscription[];
  readonly totalMonthly: Money;
  readonly totalMonthlyMine: Money;
  readonly byScope: readonly SubscriptionScopeTotal[];
  readonly overlaps: readonly SubscriptionOverlap[];
}

export interface SubscriptionsPage extends SubscriptionsOverview {
  readonly hasNext: boolean;
}

export interface SubscriptionsFilter {
  readonly status: SubscriptionStatusFilter;
  readonly scope: RecurrenceScope | null;
}

export interface RealizeForeign {
  readonly originalAmount: string;
  readonly currency: CurrencyCode;
  readonly fxRate: string;
  readonly iofBps: number;
}

export function isForeign(recurrence: Pick<SubscriptionRecurrence, 'originalAmount'>): boolean {
  return recurrence.originalAmount !== null && recurrence.originalAmount.currency !== 'BRL';
}
