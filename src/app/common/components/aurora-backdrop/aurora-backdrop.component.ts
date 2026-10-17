import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-aurora-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aurora-backdrop.component.html',
  styleUrl: './aurora-backdrop.component.css',
  host: {
    'aria-hidden': 'true',
    'data-cy': 'aurora-backdrop',
    '[class.aurora-backdrop--paused]': 'paused()',
  },
})
export class AuroraBackdropComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly paused = signal(this.document.visibilityState === 'hidden');

  constructor() {
    fromEvent(this.document, 'visibilitychange')
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.paused.set(this.document.visibilityState === 'hidden'));
  }
}
