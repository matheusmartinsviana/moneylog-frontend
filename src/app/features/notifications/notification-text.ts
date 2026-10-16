import type { AppI18n } from '~/app/common/i18n/i18n';
import { interpolate } from '~/app/common/i18n/interpolate';
import type {
  AppNotification,
  DailyMessage,
} from '~/modules/notifications/core/types/notification';
import { formatCompetence, formatIsoDate } from '~/util/date';
import { formatMoney, maskedMoney } from '~/util/money';
import { formatBps, formatRatio } from '~/util/ratio';

type Copy = AppI18n['notifications'];

export interface NotificationText {
  readonly title: string;
  readonly body: string;
}

const DATA_CURRENCY = 'BRL';
const MONEY_PARAMS = new Set([
  'amount',
  'total',
  'available',
  'committed7d',
  'installmentAmount',
  'surplus',
  'balance',
  'due',
  'difference',
  'informed',
  'documented',
]);
const DATE_PARAMS = new Set(['dueDate', 'deadline']);
const RATIO_PARAMS = new Set(['progress', 'goalProgress']);
const PLACEHOLDER = /\{\w+\}/;

function formatParams(
  params: Readonly<Record<string, string>>,
  locale: string,
  maskValues = false,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (MONEY_PARAMS.has(key)) {
      out[key] = maskValues
        ? maskedMoney(DATA_CURRENCY)
        : formatMoney({ amount: value, currency: DATA_CURRENCY });
    } else if (DATE_PARAMS.has(key)) out[key] = formatIsoDate(value, locale);
    else if (key === 'month' || key === 'competence') out[key] = formatCompetence(value, locale);
    else if (key === 'monthlyRateBps') out['monthlyRate'] = formatBps(Number(value), locale);
    else if (RATIO_PARAMS.has(key)) out[key] = formatRatio(value, locale);
    else out[key] = value;
  }
  return out;
}

export function dailyMessageText(
  params: Readonly<Record<string, string>>,
  copy: Copy,
  locale: string,
  maskValues = false,
): string {
  const formatted = formatParams(params, locale, maskValues);
  const name = formatted['name']?.trim();
  const greeting = name ? interpolate(copy.daily.greetingNamed, { name }) : copy.daily.greeting;
  const parts = [greeting];
  if (formatted['available'] !== undefined && formatted['committed7d'] !== undefined) {
    parts.push(interpolate(copy.daily.summary, formatted));
    if (formatted['goalName'] && formatted['goalProgress']) {
      parts.push(interpolate(copy.daily.goal, formatted));
    }
  }
  return parts.join(' ');
}

export function notificationText(
  notification: Pick<AppNotification, 'titleKey' | 'params'>,
  copy: Copy,
  locale: string,
  maskValues = false,
): NotificationText {
  const entry = Object.hasOwn(copy.messages, notification.titleKey)
    ? copy.messages[notification.titleKey]
    : undefined;
  if (!entry) return copy.unknownMessage;
  const params =
    notification.titleKey === 'daily.summary'
      ? { text: dailyMessageText(notification.params, copy, locale, maskValues) }
      : formatParams(notification.params, locale, maskValues);
  const title = interpolate(entry.title, params);
  const body = interpolate(entry.body, params);
  return PLACEHOLDER.test(title) || PLACEHOLDER.test(body) ? copy.unknownMessage : { title, body };
}

export function dailyText(message: DailyMessage, copy: Copy, locale: string): string {
  return dailyMessageText(message.params, copy, locale);
}

export function kindLabel(copy: Copy, kind: string): string {
  return Object.hasOwn(copy.kinds, kind)
    ? copy.kinds[kind as keyof Copy['kinds']]
    : copy.kinds.GROUPED;
}

const SUBSCRIPTION_KINDS: ReadonlySet<string> = new Set([
  'SUBSCRIPTION_OVERLAP',
  'SUBSCRIPTION_UNUSED',
  'WEEKLY_CHARGE',
]);

export function notificationLink(
  notification: Pick<AppNotification, 'ref'> & Partial<Pick<AppNotification, 'kind'>>,
): string {
  const { type, id } = notification.ref;
  if (notification.kind && SUBSCRIPTION_KINDS.has(notification.kind))
    return '/planning/subscriptions';
  switch (type) {
    case 'CARD':
      return `/cards/${encodeURIComponent(id)}`;
    case 'DEBT':
      return `/debts/${encodeURIComponent(id)}`;
    case 'GOAL':
      return `/goals/${encodeURIComponent(id)}`;
    case 'RECURRENCE':
      return '/planning';
    case 'INVOICE':
      return `/cards/invoices/${encodeURIComponent(id)}`;
    case 'TRANSACTION':
      return `/transactions/${encodeURIComponent(id)}`;
    case 'COMMITMENT':
      return `/planning/commitments/${encodeURIComponent(id)}`;
    case 'REMINDER':
      return '/notifications';
    default:
      return '/';
  }
}
