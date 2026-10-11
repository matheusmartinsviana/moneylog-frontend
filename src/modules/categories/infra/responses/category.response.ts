import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type CategoryResponse = Schemas['Category'];
export type CategoryCreateRequest = Schemas['CategoryInput'];
export type CategoryUpdateRequest = Schemas['CategoryUpdate'];
