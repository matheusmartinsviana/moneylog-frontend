import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type MoneyResponse = Schemas['Money'];
export type DashboardSummaryResponse = Schemas['DashboardSummary'];
export type UpcomingResponse = Schemas['Upcoming'];
export type UpcomingItemResponse = Schemas['UpcomingItem'];
export type UpcomingInstallmentResponse = Schemas['UpcomingChild'];
