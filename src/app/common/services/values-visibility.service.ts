import { Injectable, signal } from '@angular/core';

import { readStorage, removeStorage, writeStorage } from '~/util/safe-storage';

export const VALUES_HIDDEN_STORAGE_KEY = 'moneylog.values-hidden';

@Injectable({ providedIn: 'root' })
export class ValuesVisibilityService {
  private readonly hiddenState = signal(readStorage(VALUES_HIDDEN_STORAGE_KEY) === '1');

  readonly hidden = this.hiddenState.asReadonly();

  set(hidden: boolean): void {
    this.hiddenState.set(hidden);
    if (hidden) {
      writeStorage(VALUES_HIDDEN_STORAGE_KEY, '1');
    } else {
      removeStorage(VALUES_HIDDEN_STORAGE_KEY);
    }
  }

  toggle(): void {
    this.set(!this.hiddenState());
  }
}
