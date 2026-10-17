import type {
  CardCashOutInput,
  Debt,
  DebtInput,
  DebtUpdate,
} from '~/modules/debts/core/types/debt';
import type {
  CardCashOutRequest,
  DebtCreateRequest,
  DebtResponse,
  DebtUpdateRequest,
} from '~/modules/debts/infra/responses/debt.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toDebt(response: DebtResponse): Debt {
  return {
    id: response.id,
    kind: response.kind ?? 'PERSONAL',
    channel: response.channel ?? null,
    effectiveRate: response.effectiveRate
      ? {
          monthlyBps: response.effectiveRate.monthlyBps,
          annualBps: response.effectiveRate.annualBps,
        }
      : null,
    person: response.person ? { id: response.person.id, name: response.person.name } : null,
    creditorName: response.creditorName ?? null,
    direction: response.direction,
    origin: response.origin,
    originTransactionId: response.originTransactionId,
    principal: money(response.principal),
    settled: money(response.settled),
    outstanding: money(response.outstanding),
    status: response.status,
    date: response.date,
    expectedDate: response.expectedDate,
    overdue: response.overdue,
    description: response.description,
    category: response.category ? { id: response.category.id, name: response.category.name } : null,
    closureDate: response.closureDate,
    closureReason: response.closureReason,
    settlements: response.settlements.map((settlement) => ({
      transactionId: settlement.transactionId,
      amount: money(settlement.amount),
      date: settlement.date,
      active: settlement.active,
    })),
    cancelable: response.cancelable,
    voidable: response.voidable,
    voidBlockedBy: response.voidBlockedBy,
    version: response.version,
  };
}

export function toCreateRequest(input: DebtInput): DebtCreateRequest {
  return {
    ...(input.personId ? { personId: input.personId } : {}),
    ...(!input.personId && input.creditorName?.trim()
      ? { creditorName: input.creditorName.trim() }
      : {}),
    direction: input.direction,
    principal: input.principal,
    date: input.date,
    expectedDate: input.expectedDate,
    ...(input.description.trim() !== '' ? { description: input.description.trim() } : {}),
    ...(input.direction === 'PAYABLE' && input.personId && input.categoryId
      ? { categoryId: input.categoryId }
      : {}),
  };
}

export function toUpdateRequest(input: DebtUpdate): DebtUpdateRequest {
  return {
    ...(input.description.trim() !== '' ? { description: input.description.trim() } : {}),
    expectedDate: input.expectedDate,
    version: input.version,
  };
}

export function toCardCashOutRequest(input: CardCashOutInput): CardCashOutRequest {
  const channel = input.channel?.trim() ?? '';
  return {
    cardId: input.cardId,
    ...(input.beneficiaryPersonId
      ? { beneficiaryPersonId: input.beneficiaryPersonId }
      : input.accountId
        ? { accountId: input.accountId }
        : {}),
    principal: input.principal,
    installments: input.installments,
    ...(input.totalWithInterest !== null
      ? { totalWithInterest: input.totalWithInterest }
      : input.rateBps !== null
        ? { rateBps: input.rateBps }
        : {}),
    firstInvoiceDate: input.firstInvoiceDate,
    ...(channel !== '' ? { channel } : {}),
  };
}
