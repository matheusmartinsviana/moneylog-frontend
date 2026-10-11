import { Injectable } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';

export type EntityScope = 'accounts' | 'cards' | 'goals' | 'people' | 'recurrences';

@Injectable({ providedIn: 'root' })
export class EntityChanges {
  private readonly subject = new Subject<EntityScope>();

  notify(scope: EntityScope): void {
    this.subject.next(scope);
  }

  of(scope: EntityScope): Observable<EntityScope> {
    return this.subject.pipe(filter((s) => s === scope));
  }
}
