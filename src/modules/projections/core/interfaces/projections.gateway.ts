import { Observable } from 'rxjs';

import type { Projection, ProjectionQuery } from '~/modules/projections/core/types/projection';

export abstract class ProjectionsGateway {
  abstract get(query: ProjectionQuery): Observable<Projection>;
}
