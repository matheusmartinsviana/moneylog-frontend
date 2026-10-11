import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type DebtResponse = Omit<Schemas['Debt'], 'creditorName'> &
  Partial<Pick<Schemas['Debt'], 'creditorName'>>;
export type DebtSliceResponse = Schemas['DebtSlice'];
export type DebtCreateRequest = Schemas['DebtInput'];
export type DebtUpdateRequest = Schemas['DebtUpdate'];
export type DebtReasonRequest = Schemas['DebtReasonInput'];
