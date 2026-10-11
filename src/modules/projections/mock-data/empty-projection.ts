import type { ProjectionResponse } from '~/modules/projections/infra/responses/projection.response';

export function emptyProjection(horizon: ProjectionResponse['horizon']): ProjectionResponse {
  const zero = { amount: '0.00', currency: 'BRL' as const };
  return {
    isProjection: true,
    horizon,
    asOf: '1970-01-01',
    startingBalance: zero,
    series: [],
    assumptions: [],
    goals: { reserved: zero, items: [] },
  };
}
