import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type AssetResponse = Schemas['Asset'];
export type AssetSliceResponse = Schemas['AssetSlice'];
export type AssetCreateRequest = Schemas['AssetInput'];
export type AssetUpdateRequest = Schemas['AssetUpdate'];
export type AssetBalanceRequest = Schemas['AssetBalanceInput'];
