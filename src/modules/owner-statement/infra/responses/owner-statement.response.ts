import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type OwnerStatementResponse = Schemas['OwnerStatement'];
export type OwnerStatementMonthResponse = Schemas['OwnerStatementMonth'];
export type OwnerIncomeItemResponse = Schemas['OwnerIncomeItem'];
