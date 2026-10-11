import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionsEvents {
  private readonly subject = new Subject<void>();
  readonly changes$: Observable<void> = this.subject.asObservable();

  notifyChanged(): void {
    this.subject.next();
  }
}
