import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type IncomeProfileResponse = Schemas['IncomeProfile'];
export type IncomeProfileSliceResponse = Schemas['IncomeProfileSlice'];
export type IncomeProfileCreateRequest = Schemas['IncomeProfileInput'];
export type IncomeProfileUpdateRequest = Schemas['IncomeProfileUpdate'];
export type IncomePreviewResponse = Schemas['IncomePreview'];
export type GeneratedIncomeResponse = Schemas['GeneratedIncomeOccurrences'];
export type TaxTableListResponse = Schemas['TaxTableList'];
