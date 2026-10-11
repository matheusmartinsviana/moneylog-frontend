import type { Transaction } from '~/modules/transactions/core/types/transaction';

export type Flow = 'in' | 'out' | 'neutral';

export function flowOf(transaction: Transaction, accountId: string | null): Flow {
  const cash = transaction.impact.cash.amount;
  if (/[1-9]/.test(cash)) {
    const flow: Flow = cash.startsWith('-') ? 'out' : 'in';
    const onInvestmentSide =
      transaction.type === 'INVESTMENT' &&
      accountId !== null &&
      transaction.counterpartAccount?.id === accountId;
    return onInvestmentSide ? (flow === 'in' ? 'out' : 'in') : flow;
  }
  if (transaction.type === 'TRANSFER' && transaction.status === 'ACTIVE' && accountId !== null) {
    if (transaction.account?.id === accountId) return 'out';
    if (transaction.counterpartAccount?.id === accountId) return 'in';
  }
  return 'neutral';
}

export function flowSign(flow: Flow): string {
  return flow === 'in' ? '+' : flow === 'out' ? '−' : '';
}
