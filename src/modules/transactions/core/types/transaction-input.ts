import type {
  AdjustmentDirection,
  AdjustmentKind,
  InvestmentDirection,
  PaymentMethod,
  TransactionNature,
} from '~/modules/transactions/core/types/transaction-enums';
import type { SplitInput } from '~/util/split';

interface BaseInput {
  readonly amount: string;
  readonly date: string;
  readonly description: string;
  readonly notes: string | null;
}

export interface NewDebtInput {
  readonly personId: string;
  readonly expectedDate: string | null;
  readonly description: string | null;
}

export interface ExpenseShareInput {
  readonly amount: string;
  readonly newDebt: NewDebtInput;
}

export interface ExpenseInput extends BaseInput {
  readonly type: 'EXPENSE';
  readonly accountId: string;
  readonly categoryId: string;
  readonly method?: PaymentMethod;
  readonly nature?: TransactionNature;
  readonly shares?: readonly ExpenseShareInput[];
}

export interface LoanGivenInput extends BaseInput {
  readonly type: 'LOAN_GIVEN';
  readonly accountId: string;
  readonly newDebt: NewDebtInput;
}

export interface MoneyReceivedInput extends BaseInput {
  readonly type: 'MONEY_RECEIVED';
  readonly accountId: string;
  readonly debtId: string | null;
  readonly newDebt: NewDebtInput | null;
}

export interface DebtPaymentInput extends BaseInput {
  readonly type: 'DEBT_PAYMENT';
  readonly accountId: string;
  readonly debtId: string;
}

export interface IncomeInput extends BaseInput {
  readonly type: 'INCOME';
  readonly incomeCompetence?: string | null;
  readonly accountId: string;
  readonly categoryId: string;
  readonly method?: PaymentMethod;
}

export interface TransferInput extends BaseInput {
  readonly type: 'TRANSFER';
  readonly fromAccountId: string;
  readonly toAccountId: string;
}

export interface InvestmentInput extends BaseInput {
  readonly type: 'INVESTMENT';
  readonly cashAccountId: string;
  readonly investmentAccountId: string;
  readonly direction: InvestmentDirection;
}

export interface AdjustmentInput extends BaseInput {
  readonly type: 'ADJUSTMENT';
  readonly accountId: string;
  readonly direction: AdjustmentDirection;
  readonly kind: AdjustmentKind;
  readonly reason: string;
}

export interface RefundInput extends BaseInput {
  readonly type: 'REFUND';
  readonly accountId: string | null;
  readonly cardId: string | null;
  readonly categoryId: string;
  readonly refundOfTransactionId: string | null;
}

export interface CardPurchaseInput extends BaseInput {
  readonly type: 'CARD_PURCHASE';
  readonly cardId: string;
  readonly categoryId: string;
  readonly installments: number;
  readonly lastDigits?: string | null;
  readonly split?: SplitInput | null;
}

export type TransactionInput =
  | ExpenseInput
  | IncomeInput
  | TransferInput
  | InvestmentInput
  | AdjustmentInput
  | RefundInput
  | CardPurchaseInput
  | LoanGivenInput
  | MoneyReceivedInput
  | DebtPaymentInput;
