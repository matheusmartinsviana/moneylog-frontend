import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type IncomeExpenseSeriesResponse = Schemas['IncomeExpenseSeries'];
export type SpendingByCategoryResponse = Schemas['SpendingByCategory'];
