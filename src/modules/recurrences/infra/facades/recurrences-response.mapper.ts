import type {
  Occurrence,
  RealizedTransaction,
  Recurrence,
  RecurrenceInput,
  RecurrenceSummary,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import type {
  Subscription,
  SubscriptionRecurrence,
  SubscriptionsPage,
} from '~/modules/recurrences/core/types/subscription';
import type {
  OccurrenceResponse,
  RealizedTransactionResponse,
  RecurrenceCreateRequest,
  RecurrenceResponse,
  RecurrenceSummaryResponse,
  RecurrenceUpdateRequest,
  SubscriptionListResponse,
} from '~/modules/recurrences/infra/responses/recurrence.response';
import type { Money } from '~/util/money';
import type { SplitInput } from '~/util/split';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toRecurrence(response: RecurrenceResponse): Recurrence {
  return {
    id: response.id,
    type: response.type,
    amount: money(response.amount),
    description: response.description,
    category: { id: response.category.id, name: response.category.name },
    account: response.account ? { id: response.account.id, name: response.account.name } : null,
    card: response.card ? { id: response.card.id, name: response.card.name } : null,
    method:
      response.method === 'CASH' ||
      response.method === 'DEBIT' ||
      response.method === 'PIX' ||
      response.method === 'TRANSFER' ||
      response.method === 'BOLETO' ||
      response.method === 'OTHER'
        ? response.method
        : null,
    frequency: response.frequency,
    interval: response.interval,
    unit: response.unit,
    startDate: response.startDate,
    endDate: response.endDate,
    maxOccurrences: response.maxOccurrences,
    active: response.active,
    incomeCompetenceOffsetMonths: response.incomeCompetenceOffsetMonths === 1 ? 1 : 0,
    ended: response.ended ?? false,
    nextOccurrence: response.nextOccurrence,
    monthlyEstimate: money(response.monthlyEstimate),
    splitMode: response.splitMode ?? null,
    shares: (response.shares ?? []).map((line) => ({
      personId: line.personId,
      bps: line.bps,
      amount: line.amount ? money(line.amount) : null,
    })),
    version: response.version,
  };
}

export function toSummary(response: RecurrenceSummaryResponse): RecurrenceSummary {
  return {
    fixedCosts: money(response.fixedCosts),
    recurringIncome: money(response.recurringIncome),
    estimate: true,
  };
}

export function toOccurrence(response: OccurrenceResponse): Occurrence {
  return {
    recurrenceId: response.recurrenceId,
    date: response.date,
    status: response.status,
    overdue: response.overdue,
    type: response.type,
    direction: response.direction,
    amount: money(response.amount),
    description: response.description,
    categoryId: response.categoryId,
    accountId: response.accountId,
    cardId: response.cardId,
    transactionId: response.transactionId,
  };
}

export function toRealized(response: RealizedTransactionResponse): RealizedTransaction {
  const first = response.installments[0];
  return {
    id: response.id,
    description: response.description,
    amount: money(response.amount),
    date: response.date,
    card: response.card ? { id: response.card.id, name: response.card.name } : null,
    invoice: first
      ? {
          id: first.invoiceId,
          referenceMonth: first.invoiceReferenceMonth,
          dueDate: first.invoiceDueDate,
        }
      : null,
  };
}

function optionalText(text: string): { description?: string } {
  const value = text.trim();
  return value !== '' ? { description: value } : {};
}

function splitFields(split: SplitInput | null | undefined) {
  if (split === undefined) return {};
  if (split === null) return { shares: [] };
  return {
    splitMode: split.mode,
    shares: split.shares.map((share) => ({
      personId: share.personId,
      ...(share.bps !== undefined ? { bps: share.bps } : {}),
      ...(share.amount !== undefined ? { amount: share.amount } : {}),
    })),
  };
}

function destination(input: {
  readonly accountId: string | null;
  readonly method: RecurrenceInput['method'];
  readonly cardId: string | null;
}) {
  if (input.cardId !== null) return { cardId: input.cardId };
  if (input.accountId === null) return {};
  return { accountId: input.accountId, ...(input.method ? { method: input.method } : {}) };
}

export function toCreateRequest(input: RecurrenceInput): RecurrenceCreateRequest {
  const custom = input.frequency === 'CUSTOM';
  return {
    type: input.type,
    amount: input.amount,
    ...optionalText(input.description),
    ...(input.categoryId !== '' ? { categoryId: input.categoryId } : {}),
    ...destination(input),
    frequency: input.frequency,
    ...(custom ? { interval: input.interval, unit: input.unit } : {}),
    startDate: input.startDate,
    endDate: input.endDate,
    maxOccurrences: input.maxOccurrences,
    ...(input.type === 'INCOME' && input.incomeCompetenceOffsetMonths === 1
      ? { incomeCompetenceOffsetMonths: 1 }
      : {}),
    ...(input.type === 'CARD_PURCHASE' ? splitFields(input.split) : {}),
  };
}

export function toUpdateRequest(input: RecurrenceUpdate): RecurrenceUpdateRequest {
  return {
    amount: input.amount,
    ...optionalText(input.description),
    categoryId: input.categoryId,
    ...destination(input),
    endDate: input.endDate,
    ...(input.incomeCompetenceOffsetMonths !== undefined
      ? { incomeCompetenceOffsetMonths: input.incomeCompetenceOffsetMonths }
      : {}),
    ...splitFields(input.split),
    version: input.version,
  };
}

type SubscriptionItemResponse = SubscriptionListResponse['items'][number];

export function toSubscriptionRecurrence(
  response: SubscriptionItemResponse['recurrence'],
): SubscriptionRecurrence {
  return {
    id: response.id,
    type: response.type,
    amount: money(response.amount),
    description: response.description,
    category: { id: response.category.id, name: response.category.name },
    account: response.account ? { id: response.account.id, name: response.account.name } : null,
    card: response.card ? { id: response.card.id, name: response.card.name } : null,
    frequency: response.frequency,
    interval: response.interval,
    unit: response.unit,
    startDate: response.startDate,
    endDate: response.endDate,
    activeUntil: response.activeUntil ?? null,
    active: response.active,
    ended: response.ended ?? false,
    nextOccurrence: response.nextOccurrence,
    scope: response.scope === 'COMPANY' ? 'COMPANY' : 'PERSONAL',
    channel: response.channel ?? null,
    overlapGroup: response.overlapGroup ?? null,
    lastUsedOn: response.lastUsedOn ?? null,
    originalAmount: response.originalAmount
      ? { amount: response.originalAmount.amount, currency: response.originalAmount.currency }
      : null,
    referenceFxRate: response.referenceFxRate ?? null,
    iofBps: response.iofBps ?? null,
    version: response.version,
  };
}

function toSubscription(response: SubscriptionItemResponse): Subscription {
  return {
    recurrence: toSubscriptionRecurrence(response.recurrence),
    monthlyEquivalent: money(response.monthlyEquivalent),
    monthlyEquivalentMine: money(response.monthlyEquivalentMine),
    lastChargedAmount: response.lastChargedAmount ? money(response.lastChargedAmount) : null,
    ended: response.ended,
  };
}

export function toSubscriptionsPage(response: SubscriptionListResponse): SubscriptionsPage {
  return {
    items: response.items.map(toSubscription),
    hasNext: response.hasNext,
    totalMonthly: money(response.totalMonthly),
    totalMonthlyMine: money(response.totalMonthlyMine),
    byScope: response.byScope.map((entry) => ({
      scope: entry.scope,
      monthly: money(entry.monthly),
    })),
    overlaps: response.overlaps.map((overlap) => ({
      group: overlap.group,
      monthly: money(overlap.monthly),
      items: overlap.items.map((item) => ({
        id: item.id,
        description: item.description,
        monthlyEquivalent: money(item.monthlyEquivalent),
      })),
    })),
  };
}
