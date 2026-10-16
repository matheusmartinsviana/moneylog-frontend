import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type TransactionResponse = Schemas['Transaction'];
export type TransactionSliceResponse = Schemas['TransactionSlice'];
export type EntrySliceResponse = Schemas['EntrySlice'];
export type EntryResponse = Schemas['Entry'];
export type TransactionCreateRequest = Schemas['TransactionInput'];
export type TransactionUpdateRequest = Schemas['TransactionUpdate'];
export type VoidRequest = Schemas['VoidRequest'];
export type CancelInstallmentsRequest = Schemas['CancelInstallmentsRequest'];
export type TransactionSharesRequest = Schemas['TransactionSharesUpdate'];
