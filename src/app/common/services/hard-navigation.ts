import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HardNavigation {
  private readonly location = inject(Location);

  go(url: string): void {
    window.location.assign(this.location.prepareExternalUrl(url));
  }
}
