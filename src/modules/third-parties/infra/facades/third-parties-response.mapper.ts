import type {
  ThirdPartyExpectedMonth,
  ThirdPartyExpense,
  ThirdPartyExpenseInput,
  ThirdPartyInstallment,
  ThirdPartyItem,
  ThirdPartyReceipt,
  ThirdPartyReceiptInput,
  ThirdPartyReceivables,
} from '~/modules/third-parties/core/types/third-party';
import type {
  ThirdPartyExpectedMonthResponse,
  ThirdPartyExpenseRequest,
  ThirdPartyExpenseResponse,
  ThirdPartyInstallmentResponse,
  ThirdPartyReceiptRequest,
  ThirdPartyReceiptResponse,
  ThirdPartyReceivablesResponse,
} from '~/modules/third-parties/infra/responses/third-party.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toInstallment(installment: ThirdPartyInstallmentResponse): ThirdPartyInstallment {
  return {
    installmentId: installment.installmentId,
    number: installment.number,
    total: installment.total,
    consumptionMonth: installment.consumptionMonth,
    dueMonth: installment.dueMonth,
    expectedMonth: installment.expectedMonth,
    overridden: installment.overridden,
    owed: money(installment.owed),
    received: money(installment.received),
    pending: money(installment.pending),
  };
}

export function toExpectedMonth(
  response: ThirdPartyExpectedMonthResponse,
): ThirdPartyExpectedMonth {
  return {
    transactionId: response.transactionId,
    personId: response.personId,
    version: response.version,
    installment: toInstallment(response.installment),
  };
}

function toItem(
  item: ThirdPartyReceivablesResponse['people'][number]['items'][number],
): ThirdPartyItem {
  return {
    source: item.source,
    refId: item.refId,
    description: item.description,
    date: item.date,
    expectedDate: item.expectedDate,
    owed: money(item.owed),
    received: money(item.received),
    pending: money(item.pending),
    status: item.status,
    installments: item.installments.map(toInstallment),
  };
}

export function toReceivables(response: ThirdPartyReceivablesResponse): ThirdPartyReceivables {
  return {
    asOf: response.asOf,
    owed: money(response.owed),
    received: money(response.received),
    pending: money(response.pending),
    people: response.people.map((person) => ({
      personId: person.personId,
      name: person.name,
      owed: money(person.owed),
      received: money(person.received),
      pending: money(person.pending),
      months: person.months.map((month) => ({
        competence: month.competence,
        owed: money(month.owed),
        received: money(month.received),
        pending: money(month.pending),
      })),
      items: person.items.map(toItem),
    })),
    month: {
      competence: response.month.competence,
      grossConsumption: money(response.month.grossConsumption),
      refunds: money(response.month.refunds),
      personalNet: money(response.month.personalNet),
      thirdPartyConsumption: money(response.month.thirdPartyConsumption),
      thirdPartyReimbursed: money(response.month.thirdPartyReimbursed),
      thirdPartyPending: money(response.month.thirdPartyPending),
    },
  };
}

export function toExpense(response: ThirdPartyExpenseResponse): ThirdPartyExpense {
  return {
    id: response.id,
    transactionId: response.transactionId,
    personId: response.personId,
    note: response.note,
  };
}

export function toExpenseRequest(input: ThirdPartyExpenseInput): ThirdPartyExpenseRequest {
  const note = input.note?.trim() ?? '';
  return {
    transactionId: input.transactionId,
    personId: input.personId,
    ...(note === '' ? {} : { note }),
  };
}

export function toReceipt(response: ThirdPartyReceiptResponse): ThirdPartyReceipt {
  return {
    id: response.id,
    personId: response.personId,
    transactionId: response.transactionId,
    amount: money(response.amount),
    receivedOn: response.receivedOn,
    note: response.note,
    settlement: response.settlement,
    ledgerEffect: response.ledgerEffect ?? null,
  };
}

export function toReceiptRequest(input: ThirdPartyReceiptInput): ThirdPartyReceiptRequest {
  const note = input.note?.trim() ?? '';
  return {
    personId: input.personId,
    amount: input.amount,
    ...(input.transactionId === null ? {} : { transactionId: input.transactionId }),
    ...(input.accountId ? { accountId: input.accountId } : {}),
    ...(input.receivedOn === null ? {} : { receivedOn: input.receivedOn }),
    ...(note === '' ? {} : { note }),
  };
}
