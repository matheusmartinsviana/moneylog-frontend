import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type PurchaseSimulationResponse = Schemas['PurchaseSimulation'];
export type PurchaseSimulationRequest = Schemas['PurchaseSimulationInput'];
