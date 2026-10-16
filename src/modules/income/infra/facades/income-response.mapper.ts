import type {
  GeneratedIncomeOccurrence,
  IncomePreview,
  IncomeProfile,
  IncomeProfileInput,
  IncomeProfileUpdate,
  PayrollDeduction,
  PreviewDeduction,
  TaxTable,
} from '~/modules/income/core/types/income';
import type {
  GeneratedIncomeResponse,
  IncomePreviewResponse,
  IncomeProfileCreateRequest,
  IncomeProfileResponse,
  IncomeProfileUpdateRequest,
  TaxTableListResponse,
} from '~/modules/income/infra/responses/income.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

const moneyOrNull = (
  value: { amount: string; currency: string } | null | undefined,
): Money | null => (value ? money(value) : null);

function toDeduction(deduction: IncomeProfileResponse['deductions'][number]): PayrollDeduction {
  return {
    kind: deduction.kind,
    label: deduction.label,
    amount: moneyOrNull(deduction.amount),
    percentBps: deduction.percentBps,
    startsOn: deduction.startsOn,
    endsOn: deduction.endsOn,
    debtId: deduction.debtId,
    interestAmount: moneyOrNull(deduction.interestAmount),
  };
}

export function toIncomeProfile(response: IncomeProfileResponse): IncomeProfile {
  return {
    id: response.id,
    source: response.source,
    gross: money(response.gross),
    dependents: response.dependents,
    advance: response.advance
      ? { dayOfMonth: response.advance.dayOfMonth, percentBps: response.advance.percentBps }
      : null,
    balanceDayOfMonth: response.balanceDayOfMonth,
    deductions: response.deductions.map(toDeduction),
    thirteenth: {
      enabled: response.thirteenth.enabled,
      firstInstallmentMonth: response.thirteenth.firstInstallmentMonth,
    },
    status: response.status,
    version: response.version,
  };
}

function toPreviewDeduction(
  deduction: IncomePreviewResponse['fixedDeductions'][number],
): PreviewDeduction {
  return {
    kind: deduction.kind,
    label: deduction.label,
    amount: money(deduction.amount),
    debtId: deduction.debtId,
    interestAmount: moneyOrNull(deduction.interestAmount),
    principalAmount: moneyOrNull(deduction.principalAmount),
    confidence: deduction.confidence ?? 'CONFIRMED',
    warnings: deduction.warnings ?? [],
  };
}

export function toIncomePreview(response: IncomePreviewResponse): IncomePreview {
  return {
    month: response.month,
    gross: money(response.gross),
    inss: money(response.inss),
    irrf: money(response.irrf),
    fixedDeductions: response.fixedDeductions.map(toPreviewDeduction),
    loanDeductions: response.loanDeductions.map(toPreviewDeduction),
    net: money(response.net),
    advance: response.advance
      ? { date: response.advance.date, amount: money(response.advance.amount) }
      : null,
    balance: { date: response.balance.date, amount: money(response.balance.amount) },
    thirteenth: response.thirteenth
      ? { date: response.thirteenth.date, amount: money(response.thirteenth.amount) }
      : null,
    taxTables: response.taxTables.map((table) => ({
      kind: table.kind,
      version: table.version,
      effectiveFrom: table.effectiveFrom,
    })),
  };
}

export function toGeneratedOccurrences(
  response: GeneratedIncomeResponse,
): readonly GeneratedIncomeOccurrence[] {
  return response.items.map((item) => ({
    kind: item.kind,
    competence: item.competence,
    date: item.date,
    amount: money(item.amount),
    recurrenceId: item.recurrenceId,
    created: item.created,
  }));
}

export function toTaxTables(response: TaxTableListResponse): readonly TaxTable[] {
  return response.items.map((table) => ({
    kind: table.kind,
    version: table.version,
    effectiveFrom: table.effectiveFrom,
    effectiveTo: table.effectiveTo,
    basis: table.basis,
    brackets: table.brackets.map((bracket) => ({
      from: money(bracket.from),
      upTo: moneyOrNull(bracket.upTo),
      rateBps: bracket.rateBps,
      deduction: money(bracket.deduction),
    })),
    contributionCeiling: moneyOrNull(table.contributionCeiling),
    sources: table.sources.map((source) => ({
      agency: source.agency,
      norm: source.norm,
      url: source.url,
      consultedOn: source.consultedOn,
    })),
  }));
}

export function toCreateRequest(input: IncomeProfileInput): IncomeProfileCreateRequest {
  return {
    source: input.source.trim(),
    gross: input.gross,
    dependents: input.dependents,
    advance: input.advance
      ? { dayOfMonth: input.advance.dayOfMonth, percentBps: input.advance.percentBps }
      : null,
    balanceDayOfMonth: input.balanceDayOfMonth,
    deductions: input.deductions.map((deduction) => ({
      kind: deduction.kind,
      label: deduction.label.trim(),
      ...(deduction.amount !== null ? { amount: deduction.amount } : {}),
      ...(deduction.percentBps !== null ? { percentBps: deduction.percentBps } : {}),
      startsOn: deduction.startsOn,
      endsOn: deduction.endsOn,
      ...(deduction.kind === 'LOAN'
        ? { debtId: deduction.debtId, interestAmount: deduction.interestAmount }
        : {}),
    })),
    thirteenth: {
      enabled: input.thirteenth.enabled,
      firstInstallmentMonth: input.thirteenth.firstInstallmentMonth,
    },
  };
}

export function toUpdateRequest(input: IncomeProfileUpdate): IncomeProfileUpdateRequest {
  return { ...toCreateRequest(input), version: input.version };
}
