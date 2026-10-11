import type {
  Occurrence,
  RealizedTransaction,
  Recurrence,
  RecurrenceInput,
  RecurrenceSummary,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import type {
  OccurrenceResponse,
  RealizedTransactionResponse,
  RecurrenceCreateRequest,
  RecurrenceResponse,
  RecurrenceSummaryResponse,
  RecurrenceUpdateRequest,
} from '~/modules/recurrences/infra/responses/recurrence.response';
import type { Money } from '~/util/money';

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
    version: input.version,
  };
}
