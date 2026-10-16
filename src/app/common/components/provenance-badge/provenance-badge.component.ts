import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { I18nService } from '~/app/common/i18n/i18n.service';

export type ProvenanceOrigin = 'PRINT' | 'PAYSLIP' | 'CONTRACT' | 'INFORMED';
export type ProvenanceConfidence = 'CONFIRMED' | 'ESTIMATED';

@Component({
  selector: 'app-provenance-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-confidence]': 'confidence()',
    '[attr.data-cy]': '"provenance-badge"',
  },
  template: `<span class="badge__text">{{ text() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      padding: 0 var(--space-2);
      border-radius: var(--radius-pill, 999px);
      background-color: var(--color-surface-muted);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      line-height: 1.5;
      white-space: nowrap;
    }

    :host([data-confidence='ESTIMATED']) {
      background-color: var(--color-warning-soft);
      color: var(--color-text);
    }

    .badge__text {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class ProvenanceBadgeComponent {
  private readonly t = inject(I18nService).t;

  readonly origin = input<ProvenanceOrigin | null>(null);
  readonly confidence = input<ProvenanceConfidence>('CONFIRMED');
  readonly showOrigin = input(true);

  protected readonly text = computed(() => {
    const copy = this.t().provenance;
    const origin = this.origin();
    const confidence = copy.confidence[this.confidence()];
    return this.showOrigin() && origin !== null && origin !== 'INFORMED'
      ? `${confidence} · ${copy.origin[origin]}`
      : confidence;
  });
}
