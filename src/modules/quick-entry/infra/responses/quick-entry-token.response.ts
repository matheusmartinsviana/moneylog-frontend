import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type QuickEntryTokenResponse = Schemas['QuickEntryToken'];
export type QuickEntryTokenCreatedResponse = Schemas['QuickEntryTokenCreated'];
export type QuickEntryTokenCreateRequest = Schemas['QuickEntryTokenInput'];
export type QuickEntryTokenRenameRequest = Schemas['QuickEntryTokenRename'];
