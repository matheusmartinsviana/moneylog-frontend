import type {
  OccurrenceSliceResponse,
  RecurrenceSliceResponse,
  RecurrenceSummaryResponse,
  SubscriptionListResponse,
} from '~/modules/recurrences/infra/responses/recurrence.response';

export const EMPTY_RECURRENCES: RecurrenceSliceResponse = { items: [], hasNext: false };
export const EMPTY_OCCURRENCES: OccurrenceSliceResponse = { items: [], hasNext: false };
export const EMPTY_RECURRENCE_SUMMARY: RecurrenceSummaryResponse = {
  view: 'MINE',
  fixedCosts: { amount: '0.00', currency: 'BRL' },
  recurringIncome: { amount: '0.00', currency: 'BRL' },
  estimate: true,
};
export const EMPTY_SUBSCRIPTIONS: SubscriptionListResponse = {
  items: [],
  hasNext: false,
  totalMonthly: { amount: '0.00', currency: 'BRL' },
  totalMonthlyMine: { amount: '0.00', currency: 'BRL' },
  byScope: [],
  overlaps: [],
};
