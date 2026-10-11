import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type MonthlySummaryResponse = Schemas['MonthlySummary'];
export type SummaryDeltaResponse = Schemas['SummaryDelta'];
export type SummaryTotalsResponse = Schemas['SummaryTotals'];
