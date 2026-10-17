import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type PurchaseGroupResponse = Schemas['PurchaseGroup'];
export type PurchaseGroupSliceResponse = Schemas['PurchaseGroupSlice'];
export type PurchaseGroupCreateRequest = Schemas['PurchaseGroupInput'];
export type PurchaseGroupUpdateRequest = Schemas['PurchaseGroupUpdate'];
export type PurchaseGroupMemberRequest = Schemas['PurchaseGroupMemberInput'];
export type PurchaseCommitmentsResponse = Schemas['PurchaseGroupCommitments'];
