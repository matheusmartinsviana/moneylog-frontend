import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type DebtOverviewResponse = Schemas['DebtOverview'];
export type OngoingInstallmentsRequest = Schemas['OngoingInstallmentsRequest'];
export type OngoingPreviewResponse = Schemas['OngoingPreview'];
export type OngoingTransactionResponse = Schemas['Transaction'];
