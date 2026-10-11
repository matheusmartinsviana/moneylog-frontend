import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type PersonResponse = Schemas['Person'];
export type PersonDetailResponse = Schemas['PersonDetail'];
export type PersonSliceResponse = Schemas['PersonSlice'];
export type PersonCreateRequest = Schemas['PersonInput'];
export type PersonUpdateRequest = Schemas['PersonUpdate'];
