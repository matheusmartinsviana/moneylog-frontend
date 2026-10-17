import type { Money } from '~/util/money';
import type { PersonShareLine, SplitInput, SplitMode } from '~/util/split';

export const RECURRENCE_CURRENCY = 'BRL';

export type RecurrenceType = 'EXPENSE' | 'INCOME' | 'CARD_PURCHASE';
export const RECURRENCE_TYPES = [
  'EXPENSE',
  'INCOME',
  'CARD_PURCHASE',
] as const satisfies readonly RecurrenceType[];

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export const FREQUENCIES = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'CUSTOM',
] as const satisfies readonly Frequency[];

export type IntervalUnit = 'DAYS' | 'WEEKS' | 'MONTHS';
export const INTERVAL_UNITS = [
  'DAYS',
  'WEEKS',
  'MONTHS',
] as const satisfies readonly IntervalUnit[];

export type RecurrenceMethod = 'CASH' | 'DEBIT' | 'PIX' | 'TRANSFER' | 'BOLETO' | 'OTHER';

export type OccurrenceStatus = 'PENDING' | 'REALIZED' | 'SKIPPED';

export interface Ref {
  readonly id: string;
  readonly name: string;
}

export interface Recurrence {
  readonly id: string;
  readonly type: RecurrenceType;
  readonly amount: Money;
  readonly description: string | null;
  readonly category: Ref;
  readonly account: Ref | null;
  readonly card: Ref | null;
  readonly method: RecurrenceMethod | null;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly unit: IntervalUnit | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly maxOccurrences: number | null;
  readonly active: boolean;
  readonly incomeCompetenceOffsetMonths: 0 | 1;
  readonly ended: boolean;
  readonly nextOccurrence: string | null;
  readonly monthlyEstimate: Money;
  readonly splitMode: SplitMode | null;
  readonly shares: readonly PersonShareLine[];
  readonly version: number;
}

export interface RecurrenceInput {
  readonly type: RecurrenceType;
  readonly amount: string;
  readonly description: string;
  readonly categoryId: string;
  readonly accountId: string | null;
  readonly method: RecurrenceMethod | null;
  readonly cardId: string | null;
  readonly frequency: Frequency;
  readonly interval: number | null;
  readonly unit: IntervalUnit | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly maxOccurrences: number | null;
  readonly incomeCompetenceOffsetMonths?: 0 | 1;
  readonly split?: SplitInput | null;
}

export interface RecurrenceUpdate {
  readonly amount: string;
  readonly description: string;
  readonly categoryId: string;
  readonly accountId: string | null;
  readonly method: RecurrenceMethod | null;
  readonly cardId: string | null;
  readonly endDate: string | null;
  readonly incomeCompetenceOffsetMonths?: 0 | 1;
  readonly split?: SplitInput | null;
  readonly version: number;
}

export interface RecurrenceSummary {
  readonly fixedCosts: Money;
  readonly recurringIncome: Money;
  readonly estimate: true;
}

export interface Occurrence {
  readonly recurrenceId: string;
  readonly date: string;
  readonly status: OccurrenceStatus;
  readonly overdue: boolean;
  readonly type: RecurrenceType;
  readonly direction: 'IN' | 'OUT';
  readonly amount: Money;
  readonly description: string | null;
  readonly categoryId: string;
  readonly accountId: string | null;
  readonly cardId: string | null;
  readonly transactionId: string | null;
}

export interface RealizedTransaction {
  readonly id: string;
  readonly description: string;
  readonly amount: Money;
  readonly date: string;
  readonly card: Ref | null;
  readonly invoice: {
    readonly id: string;
    readonly referenceMonth: string;
    readonly dueDate: string;
  } | null;
}

export interface RealizePayment {
  readonly accountId: string;
  readonly method: RecurrenceMethod;
}

export function isAccountToDefine(
  recurrence: Pick<Recurrence, 'type' | 'account' | 'card'>,
): boolean {
  return (
    recurrence.type !== 'CARD_PURCHASE' && recurrence.account === null && recurrence.card === null
  );
}
