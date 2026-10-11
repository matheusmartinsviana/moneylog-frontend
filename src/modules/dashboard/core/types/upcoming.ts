import type { Money } from '~/util/money';

export const UPCOMING_BUCKETS = [
  'OVERDUE',
  'TODAY',
  'TOMORROW',
  'NEXT_7_DAYS',
  'NEXT_30_DAYS',
  'LATER',
] as const;
export type UpcomingBucket = (typeof UPCOMING_BUCKETS)[number];

export type UpcomingKind =
  | 'INVOICE'
  | 'INVOICE_FORECAST'
  | 'DEBT_PAYABLE'
  | 'DEBT_RECEIVABLE'
  | 'RECURRENCE'
  | 'SCHEDULED_TRANSACTION';

export type UpcomingDirection = 'IN' | 'OUT';

export interface UpcomingInstallment {
  readonly kind: 'INSTALLMENT';
  readonly label: string;
  readonly installment: { readonly number: number; readonly total: number };
  readonly amount: Money;
  readonly informational: true;
}

export interface UpcomingItem {
  readonly kind: UpcomingKind;
  readonly bucket: UpcomingBucket | null;
  readonly dueDate: string | null;
  readonly direction: UpcomingDirection;
  readonly amount: Money;
  readonly label: string;
  readonly refType: string;
  readonly refId: string | null;
  readonly items: readonly UpcomingInstallment[];
}

export interface Upcoming {
  readonly items: readonly UpcomingItem[];
  readonly undated: readonly UpcomingItem[];
  readonly totals: { readonly out: Money; readonly in: Money };
  readonly overdueTruncated: boolean;
}
