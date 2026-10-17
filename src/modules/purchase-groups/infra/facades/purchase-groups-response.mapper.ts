import type {
  PurchaseCommitments,
  PurchaseGroup,
  PurchaseGroupInput,
  PurchaseGroupMember,
  PurchaseGroupUpdate,
} from '~/modules/purchase-groups/core/types/purchase-group';
import type {
  PurchaseCommitmentsResponse,
  PurchaseGroupCreateRequest,
  PurchaseGroupResponse,
  PurchaseGroupUpdateRequest,
} from '~/modules/purchase-groups/infra/responses/purchase-group.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

function toMember(member: PurchaseGroupResponse['members'][number]): PurchaseGroupMember {
  return {
    transactionId: member.transactionId,
    card: { id: member.card.id, name: member.card.name },
    description: member.description,
    totalInstallments: member.totalInstallments,
    remainingInstallments: member.remainingInstallments,
    installmentAmount: money(member.installmentAmount),
    total: money(member.total),
    remaining: money(member.remaining),
    myRemaining: money(member.myRemaining),
    lastDueDate: member.lastDueDate,
  };
}

export function toPurchaseGroup(response: PurchaseGroupResponse): PurchaseGroup {
  return {
    id: response.id,
    name: response.name,
    interest: response.interest,
    status: response.status,
    total: money(response.total),
    remaining: money(response.remaining),
    myRemaining: money(response.myRemaining),
    installmentAmountPerMonth: money(response.installmentAmountPerMonth),
    lastDueDate: response.lastDueDate,
    divergence: response.divergence
      ? {
          declared: money(response.divergence.declared),
          computed: money(response.divergence.computed),
          difference: money(response.divergence.difference),
        }
      : null,
    members: response.members.map(toMember),
    version: response.version,
  };
}

export function toPurchaseCommitments(response: PurchaseCommitmentsResponse): PurchaseCommitments {
  return {
    until: response.until,
    committed: money(response.committed),
    committedMine: money(response.committedMine),
    byMonth: response.byMonth.map((month) => ({
      competence: month.competence,
      amount: money(month.amount),
      mine: money(month.mine),
    })),
  };
}

export function toCreateRequest(input: PurchaseGroupInput): PurchaseGroupCreateRequest {
  return {
    name: input.name.trim(),
    interest: input.interest,
    ...(input.declaredTotal !== null && input.declaredTotal !== ''
      ? { declaredTotal: input.declaredTotal }
      : {}),
    members: input.members.map((member) => ({
      cardId: member.cardId,
      totalInstallments: member.totalInstallments,
      installmentAmount: member.installmentAmount,
      ...(member.remainingInstallments !== null &&
      member.remainingInstallments < member.totalInstallments
        ? { remainingInstallments: member.remainingInstallments }
        : {}),
      firstInvoiceDate: member.firstInvoiceDate,
    })),
  };
}

export function toUpdateRequest(input: PurchaseGroupUpdate): PurchaseGroupUpdateRequest {
  return { name: input.name.trim(), interest: input.interest, version: input.version };
}
