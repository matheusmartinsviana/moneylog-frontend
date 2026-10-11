export type NotificationKind =
  | 'INVOICE_DUE'
  | 'DEBT_COLLECT'
  | 'DEBT_PAYABLE_DUE'
  | 'RECURRENCE_PENDING'
  | 'COMMITTED_NEXT_MONTH'
  | 'DAILY_SUMMARY'
  | 'REMINDER'
  | 'GOAL_DEADLINE'
  | 'GROUPED';

export type NotificationRefType = 'CARD' | 'DEBT' | 'RECURRENCE' | 'GOAL' | 'REMINDER' | 'USER';

export const CONFIGURABLE_KINDS = [
  'INVOICE_DUE',
  'DEBT_COLLECT',
  'DEBT_PAYABLE_DUE',
  'RECURRENCE_PENDING',
  'COMMITTED_NEXT_MONTH',
  'GOAL_DEADLINE',
] as const;
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
  readonly version: number;
}

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
