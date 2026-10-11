import { Observable } from 'rxjs';

import type {
  Category,
  CategoryInput,
  CategoryKind,
  CategoryRename,
} from '~/modules/categories/core/types/category';

export interface CategoriesQuery {
  readonly kind?: CategoryKind;
  readonly includeArchived: boolean;
}

export abstract class CategoriesGateway {
  abstract list(query: CategoriesQuery): Observable<readonly Category[]>;
  abstract create(input: CategoryInput): Observable<Category>;
  abstract rename(id: string, input: CategoryRename): Observable<Category>;
  abstract archive(id: string): Observable<Category>;
  abstract unarchive(id: string): Observable<Category>;
}
