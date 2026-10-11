import type { PersonSliceResponse } from '~/modules/people/infra/responses/person.response';

export const EMPTY_PEOPLE: PersonSliceResponse = { items: [], hasNext: false };
