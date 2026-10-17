export type NotificationKind =
  | 'INVOICE_DUE'
  | 'DEBT_COLLECT'
  | 'DEBT_PAYABLE_DUE'
  | 'RECURRENCE_PENDING'
  | 'COMMITTED_NEXT_MONTH'
  | 'DAILY_SUMMARY'
  | 'REMINDER'
  | 'GOAL_DEADLINE'
  | 'GROUPED'
  | 'INVOICE_DUE_AUTODEBIT_OFF'
  | 'NEGATIVE_MONTH_PROJECTED'
  | 'NEW_DEBT_BEFORE_FINANCING'
  | 'CARD_CASH_OUT_COST'
  | 'SUBSCRIPTION_OVERLAP'
  | 'SUBSCRIPTION_UNUSED'
  | 'WEEKLY_CHARGE'
  | 'THIRD_PARTY_OVERDUE'
  | 'BALANCE_BELOW_REAL_ESTATE'
  | 'DOCUMENT_DIVERGENCE';

export type NotificationRefType =
  | 'CARD'
  | 'DEBT'
  | 'RECURRENCE'
  | 'GOAL'
  | 'REMINDER'
  | 'USER'
  | 'COMMITMENT'
  | 'ASSET'
  | 'TRANSACTION'
  | 'INVOICE';

export const BASE_KINDS = [
  'INVOICE_DUE',
  'DEBT_COLLECT',
  'DEBT_PAYABLE_DUE',
  'RECURRENCE_PENDING',
  'COMMITTED_NEXT_MONTH',
  'GOAL_DEADLINE',
] as const;

export const ALERT_KINDS = [
  'INVOICE_DUE_AUTODEBIT_OFF',
  'NEGATIVE_MONTH_PROJECTED',
  'NEW_DEBT_BEFORE_FINANCING',
  'CARD_CASH_OUT_COST',
  'SUBSCRIPTION_OVERLAP',
  'SUBSCRIPTION_UNUSED',
  'WEEKLY_CHARGE',
  'THIRD_PARTY_OVERDUE',
  'BALANCE_BELOW_REAL_ESTATE',
  'DOCUMENT_DIVERGENCE',
] as const;

export const CONFIGURABLE_KINDS = [...BASE_KINDS, ...ALERT_KINDS] as const;
export type ConfigurableKind = (typeof CONFIGURABLE_KINDS)[number];

export interface AppNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly params: Readonly<Record<string, string>>;
  readonly ref: { readonly type: NotificationRefType; readonly id: string };
  readonly onDate: string;
  readonly dueOn: string | null;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface NotificationsQuery {
  readonly status: 'UNREAD' | 'ALL';
  readonly kind: NotificationKind | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface ReminderLink {
  readonly type: string;
  readonly id: string;
}

export interface Reminder {
  readonly id: string;
  readonly title: string;
  readonly remindOn: string;
  readonly remindAt: string | null;
  readonly note: string | null;
  readonly link: ReminderLink | null;
  readonly done: boolean;
  readonly doneAt: string | null;
  readonly createdAt: string;
}

export interface ReminderInput {
  readonly title: string;
  readonly remindOn: string;
  readonly remindAt: string | null;
  readonly note: string | null;
  readonly link: ReminderLink | null;
}

export type SummaryFrequency = 'DAILY' | 'ONLY_DUE' | 'OFF';

export interface AlertSettings {
  readonly subscriptionUnusedDays: number | null;
  readonly invoiceDueLeadDays: number;
  readonly documentDivergenceTolerance: string;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  subscriptionUnusedDays: null,
  invoiceDueLeadDays: 3,
  documentDivergenceTolerance: '0.00',
};

export interface NotificationSettings {
  readonly dailySummary: {
    readonly enabled: boolean;
    readonly time: string;
    readonly frequency: SummaryFrequency;
  };
  readonly kinds: Readonly<Partial<Record<ConfigurableKind, boolean>>>;
  readonly quietHours: { readonly from: string; readonly to: string };
  readonly push: { readonly enabled: boolean };
  readonly displayName: string | null;
  readonly alerts: AlertSettings;
  readonly version: number;
  readonly hasPhoto: boolean;
  readonly photoVersion: number;
}

export interface ProfilePhoto {
  readonly hasPhoto: boolean;
  readonly photoVersion: number;
}

export const PROFILE_PHOTO_ACCEPT = '.jpg,.jpeg,.png';

export interface PushConfig {
  readonly enabled: boolean;
  readonly publicKey: string | null;
}

export interface PushSubscriptionInput {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
  readonly userAgent: string | null;
}

export interface DailyMessage {
  readonly key: string;
  readonly params: Readonly<Record<string, string>>;
  readonly generatedAt: string;
}
