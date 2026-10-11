import type {
  AdjustmentKind,
  InstallmentStatus,
  InvoiceStatus,
  PaymentMethod,
  TransactionDirection,
  TransactionSource,
  TransactionStatus,
  TransactionType,
  VoidBlockedBy,
} from '~/modules/transactions/core/types/transaction-enums';
import type { TransactionInput } from '~/modules/transactions/core/types/transaction-input';
import type { DebtSummary } from '~/util/debt';
import type { Money } from '~/util/money';

export interface Ref {
  readonly id: string;
  readonly name: string;
}

export interface Installment {
  readonly number: number;
  readonly total: number;
  readonly amount: Money;
  readonly competence: string;
  readonly invoiceId: string;
  readonly invoiceReferenceMonth: string;
  readonly invoiceDueDate: string;
  readonly status: InstallmentStatus;
  readonly lateEntry: boolean;
}

export interface TransactionInvoiceRef {
  readonly id: string;
  readonly referenceMonth: string;
  readonly closingDate: string;
  readonly dueDate: string;
  readonly status: InvoiceStatus;
}

export interface ConsumptionImpact {
  readonly competence: string;
  readonly amount: Money;
}

export interface Impact {
  readonly cash: Money;
  readonly consumption: readonly ConsumptionImpact[];
  readonly netWorth: Money;
  readonly commitment: Money;
}

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly amount: Money;
  readonly date: string;
  readonly description: string;
  readonly notes: string | null;
  readonly category: Ref | null;
  readonly card: Ref | null;
  readonly account: Ref | null;
  readonly counterpartAccount: Ref | null;
  readonly method: PaymentMethod | null;
  readonly direction: TransactionDirection | null;
  readonly adjustmentKind: AdjustmentKind | null;
  readonly reason: string | null;
  readonly refundOf: { readonly id: string; readonly description: string } | null;
  readonly installments: readonly Installment[];
  readonly invoice: TransactionInvoiceRef | null;
  readonly debt: DebtSummary | null;
  readonly shares: readonly DebtSummary[];
  readonly incomeCompetence: string | null;
  readonly recurrenceId: string | null;
  readonly occurrenceDate: string | null;
  readonly impact: Impact;
  readonly editable: boolean;
  readonly voidable: boolean;
  readonly voidBlockedBy: VoidBlockedBy | null;
  readonly voidReason: string | null;
  readonly voidedAt: string | null;
  readonly source: TransactionSource;
  readonly version: number;
  readonly formValue: TransactionInput | null;
}

export interface TransactionTotals {
  readonly count: number;
  readonly cashFlow: { readonly in: Money; readonly out: Money; readonly net: Money };
}
