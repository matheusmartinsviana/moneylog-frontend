import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type ProjectionResponse = Schemas['Projection'];
export type ProjectionTrendResponse = Schemas['ProjectionTrend'];
