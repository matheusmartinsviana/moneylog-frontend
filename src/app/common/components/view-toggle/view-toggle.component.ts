import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';

import { SegmentedToggleComponent } from '~/app/common/components/segmented-toggle/segmented-toggle.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { parseView, type ViewMode } from '~/util/view-mode';

@Component({
  selector: 'app-view-toggle',
  imports: [SegmentedToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="view" data-cy="view-toggle-block">
      <app-segmented-toggle
        cy="view-toggle"
        [label]="t().view.label"
        [options]="options()"
        [value]="view()"
        (valueChange)="select($event)"
      />
      <p class="view__hint" role="status" data-cy="view-hint">{{ t().view.hint[view()] }}</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .view {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-4);
    }

    .view__hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `,
})
export class ViewToggleComponent {
  protected readonly t = inject(I18nService).t;

  readonly view = model.required<ViewMode>();

  protected readonly options = computed(() => [
    { value: 'MINE', label: this.t().view.MINE },
    { value: 'GROSS', label: this.t().view.GROSS },
  ]);

  protected select(value: string): void {
    this.view.set(parseView(value));
  }
}
