import type { Money } from '~/util/money';

export const INCOME_CURRENCY = 'BRL';

export const DEDUCTION_KINDS = ['TAX', 'BENEFIT', 'UNION', 'LOAN', 'OTHER'] as const;
export type DeductionKind = (typeof DEDUCTION_KINDS)[number];

export type IncomeProfileStatus = 'ACTIVE' | 'ARCHIVED';

export interface PayrollAdvance {
  readonly dayOfMonth: number;
  readonly percentBps: number;
}

export interface ThirteenthSettings {
  readonly enabled: boolean;
  readonly firstInstallmentMonth: number;
}

export interface PayrollDeduction {
  readonly kind: DeductionKind;
  readonly label: string;
  readonly amount: Money | null;
  readonly percentBps: number | null;
  readonly startsOn: string | null;
  readonly endsOn: string | null;
  readonly debtId: string | null;
  readonly interestAmount: Money | null;
}

export interface IncomeProfile {
  readonly id: string;
  readonly source: string;
  readonly gross: Money;
  readonly dependents: number;
  readonly advance: PayrollAdvance | null;
  readonly balanceDayOfMonth: number;
  readonly deductions: readonly PayrollDeduction[];
  readonly thirteenth: ThirteenthSettings;
  readonly status: IncomeProfileStatus;
  readonly version: number;
}

export interface PayrollDeductionInput {
  readonly kind: DeductionKind;
  readonly label: string;
  readonly amount: string | null;
  readonly percentBps: number | null;
  readonly startsOn: string | null;
  readonly endsOn: string | null;
  readonly debtId: string | null;
  readonly interestAmount: string | null;
}

export interface IncomeProfileInput {
  readonly source: string;
  readonly gross: string;
  readonly dependents: number;
  readonly advance: PayrollAdvance | null;
  readonly balanceDayOfMonth: number;
  readonly deductions: readonly PayrollDeductionInput[];
  readonly thirteenth: ThirteenthSettings;
}

export interface IncomeProfileUpdate extends IncomeProfileInput {
  readonly version: number;
}

export type IncomeConfidence = 'CONFIRMED' | 'ESTIMATED';

export interface PreviewDeduction {
  readonly kind: DeductionKind;
  readonly label: string;
  readonly amount: Money;
  readonly debtId: string | null;
  readonly interestAmount: Money | null;
  readonly principalAmount: Money | null;
  readonly confidence: IncomeConfidence;
  readonly warnings: readonly string[];
}

export interface PayrollPayment {
  readonly date: string;
  readonly amount: Money;
}

export interface TaxTableRef {
  readonly kind: 'INSS' | 'IRRF';
  readonly version: number;
  readonly effectiveFrom: string;
}

export interface IncomePreview {
  readonly month: string;
  readonly gross: Money;
  readonly inss: Money;
  readonly irrf: Money;
  readonly fixedDeductions: readonly PreviewDeduction[];
  readonly loanDeductions: readonly PreviewDeduction[];
  readonly net: Money;
  readonly advance: PayrollPayment | null;
  readonly balance: PayrollPayment;
  readonly thirteenth: PayrollPayment | null;
  readonly taxTables: readonly TaxTableRef[];
}

export type GeneratedIncomeKind = 'ADVANCE' | 'BALANCE' | 'THIRTEENTH_FIRST';

export interface GeneratedIncomeOccurrence {
  readonly kind: GeneratedIncomeKind;
  readonly competence: string;
  readonly date: string;
  readonly amount: Money;
  readonly recurrenceId: string;
  readonly created: boolean;
}

export interface TaxBracket {
  readonly from: Money;
  readonly upTo: Money | null;
  readonly rateBps: number;
  readonly deduction: Money;
}

export interface TaxSource {
  readonly agency: string;
  readonly norm: string;
  readonly url: string;
  readonly consultedOn: string;
}

export interface TaxTable {
  readonly kind: 'INSS' | 'IRRF';
  readonly version: number;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly basis: 'COMPETENCE' | 'PAYMENT_DATE';
  readonly brackets: readonly TaxBracket[];
  readonly contributionCeiling: Money | null;
  readonly sources: readonly TaxSource[];
}

export const GENERATE_MAX_MONTHS = 12;

export function competenceSpan(from: string, to: string): number {
  const months = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7));
  return months(to) - months(from) + 1;
}

export function isValidGenerateWindow(from: string, to: string): boolean {
  const span = competenceSpan(from, to);
  return span >= 1 && span <= GENERATE_MAX_MONTHS;
}
