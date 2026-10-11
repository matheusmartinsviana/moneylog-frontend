import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { activeModal } from '~/app/common/components/overlay/modal-lock';

@Injectable({ providedIn: 'root' })
export class LiveAnnouncer {
  private readonly document = inject(DOCUMENT);
  private region: HTMLElement | null = null;
  private flip = false;
  private pending: ReturnType<typeof setTimeout> | null = null;

  announce(message: string): void {
    this.cancelPending();
    const region = this.ensureRegion();
    const container = activeModal() ?? this.document.body;
    const moved = region.parentElement !== container;
    if (moved) container.appendChild(region);
    this.flip = !this.flip;
    const text = message + (this.flip ? '' : ' ');
    if (moved) {
      this.pending = setTimeout(() => {
        this.pending = null;
        region.textContent = text;
      }, 50);
    } else region.textContent = text;
  }

  private cancelPending(): void {
    if (this.pending !== null) clearTimeout(this.pending);
    this.pending = null;
  }

  private ensureRegion(): HTMLElement {
    if (this.region?.isConnected) return this.region;
    const region = this.document.createElement('div');
    region.className = 'visually-hidden';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('data-cy', 'live-announcer');
    region.setAttribute('data-modal-safe', '');
    this.document.body.appendChild(region);
    this.region = region;
    return region;
  }
}
