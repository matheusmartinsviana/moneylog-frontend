import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type GoalResponse = Schemas['Goal'];
export type GoalPhotoResponse = Schemas['GoalPhoto'];
export type GoalSliceResponse = Schemas['GoalSlice'];
export type GoalReservationResponse = Schemas['GoalReservation'];
export type GoalCreateRequest = Schemas['GoalInput'];
export type GoalUpdateRequest = Schemas['GoalUpdate'];
export type GoalReservationRequest = Schemas['GoalReservationInput'];
export type GoalActionRequest = Schemas['GoalActionInput'];
export type GoalCheckInRequest = Schemas['GoalCheckInInput'];
export type MetricDebtOverviewResponse = Schemas['DebtOverview'];
export type MetricDashboardResponse = Schemas['DashboardSummary'];
export type MetricRecurrenceSummaryResponse = Schemas['RecurrenceSummary'];
