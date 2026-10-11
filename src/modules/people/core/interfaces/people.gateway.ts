import { Observable } from 'rxjs';

import type {
  Person,
  PersonDetail,
  PersonInput,
  PersonStatus,
  PersonUpdate,
} from '~/modules/people/core/types/person';
import type { Slice } from '~/util/api/slice';

export interface PeopleQuery {
  readonly status?: PersonStatus;
  readonly q?: string;
  readonly page: number;
  readonly pageSize: number;
}

export abstract class PeopleGateway {
  abstract list(query: PeopleQuery): Observable<Slice<Person>>;
  abstract get(id: string): Observable<PersonDetail>;
  abstract create(input: PersonInput, idempotencyKey: string): Observable<Person>;
  abstract update(id: string, input: PersonUpdate): Observable<Person>;
  abstract archive(id: string): Observable<Person>;
  abstract unarchive(id: string): Observable<Person>;
}
