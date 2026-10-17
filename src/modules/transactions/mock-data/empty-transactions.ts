import type {
  EntrySliceResponse,
  TransactionResponse,
  TransactionSliceResponse,
} from '~/modules/transactions/infra/responses/transaction.response';

const zero = () => ({ amount: '0.00', currency: 'BRL' as const });

export const EMPTY_TRANSACTION_SLICE: TransactionSliceResponse = {
  items: [],
  hasNext: false,
  totals: { count: 0, cashFlow: { in: zero(), out: zero(), net: zero() } },
};

export const EMPTY_ENTRY_SLICE: EntrySliceResponse = {
  view: 'MINE',
  items: [],
  hasNext: false,
  totals: { total: zero(), byCategory: [] },
};

export function mockCreatedTransaction(
  body: Pick<TransactionResponse, 'amount' | 'date' | 'description' | 'notes'> & {
    type: TransactionResponse['type'];
  },
): TransactionResponse {
  return {
    id: '00000000-0000-4000-8000-000000000003',
    type: body.type,
    status: 'ACTIVE',
    amount: body.amount,
    date: body.date,
    description: body.description,
    notes: body.notes,
    category: null,
    card: null,
    account: null,
    counterpartAccount: null,
    method: null,
    direction: null,
    adjustmentKind: null,
    reason: null,
    refundOf: null,
    installments: [],
    impact: { cash: zero(), consumption: [], netWorth: zero(), commitment: zero() },
    editable: false,
    voidable: false,
    voidBlockedBy: null,
    voidReason: null,
    voidedAt: null,
    source: 'MANUAL',
    version: 0,
    createdAt: `${body.date}T00:00:00Z`,
    updatedAt: `${body.date}T00:00:00Z`,
  };
}
