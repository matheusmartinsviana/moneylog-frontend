import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

import { CategoriesGateway } from '~/modules/categories/core/interfaces/categories.gateway';
import type {
  Category,
  CategoryInput,
  CategoryKind,
  CategoryRename,
} from '~/modules/categories/core/types/category';

@Injectable({ providedIn: 'root' })
export class CategoriesFacade {
  private readonly gateway = inject(CategoriesGateway);
  private cache = new Map<string, Observable<readonly Category[]>>();

  list(kind: CategoryKind, includeArchived = false): Observable<readonly Category[]> {
    const key = `${kind}:${includeArchived}`;
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.gateway
        .list({ kind, includeArchived })
        .pipe(
          tap({ error: () => this.cache.delete(key) }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.cache.set(key, cached);
    }
    return cached;
  }

  create(input: CategoryInput): Observable<Category> {
    return this.gateway.create(input).pipe(tap(() => this.invalidate()));
  }

  rename(id: string, input: CategoryRename): Observable<Category> {
    return this.gateway.rename(id, input).pipe(tap(() => this.invalidate()));
  }

  archive(id: string): Observable<Category> {
    return this.gateway.archive(id).pipe(tap(() => this.invalidate()));
  }

  unarchive(id: string): Observable<Category> {
    return this.gateway.unarchive(id).pipe(tap(() => this.invalidate()));
  }

  invalidate(): void {
    this.cache = new Map();
  }
}
