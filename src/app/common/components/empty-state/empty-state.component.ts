import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '~/app/common/i18n/i18n.service';

export interface EmptyStateAction {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
  readonly primary?: boolean;
  readonly link?: string;
}

export type EmptyStateIllustration = 'log' | 'grid' | 'timeline' | 'document';

let nextId = 0;

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  protected readonly t = inject(I18nService).t;

  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly actions = input<readonly EmptyStateAction[]>([]);
  readonly illustration = input<EmptyStateIllustration>('log');

  readonly action = output<string>();

  protected readonly headingId = `empty-state-title-${++nextId}`;
  protected readonly hintId = `empty-state-hint-${nextId}`;
  protected readonly hasUnavailable = computed(() =>
    this.actions().some((a) => !a.available && !a.link),
  );

  protected trigger(item: EmptyStateAction): void {
    if (item.available) this.action.emit(item.id);
  }
}
