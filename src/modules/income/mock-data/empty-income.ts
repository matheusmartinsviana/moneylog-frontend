import type {
  GeneratedIncomeResponse,
  IncomeProfileSliceResponse,
  TaxTableListResponse,
} from '~/modules/income/infra/responses/income.response';

export const EMPTY_INCOME_PROFILES: IncomeProfileSliceResponse = { items: [], hasNext: false };

export const EMPTY_GENERATED_INCOME: GeneratedIncomeResponse = { items: [] };

export function emptyTaxTables(year: number): TaxTableListResponse {
  return { year, items: [] };
}
