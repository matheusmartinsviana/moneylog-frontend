import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CheckboxComponent } from '~/app/common/components/forms/checkbox/checkbox.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { formatMoney, type Money } from '~/util/money';

export interface CutOption {
  readonly id: string;
  readonly name: string;
  readonly monthly: Money;
}

@Component({
  selector: 'app-subscription-cuts',
  imports: [CheckboxComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription-cuts.component.html',
  styleUrl: './subscription-cuts.component.css',
})
export class SubscriptionCutsComponent {
  protected readonly t = inject(I18nService).t;

  readonly options = input.required<readonly CutOption[]>();
  readonly selected = input.required<readonly string[]>();
  readonly toggled = output<{ readonly id: string; readonly checked: boolean }>();

  protected readonly summary = computed(() => {
    const count = this.selected().length;
    const copy = this.t().simulator.cuts;
    return count === 0 ? copy.none : interpolate(copy.selected, { count: String(count) });
  });

  protected perMonth(option: CutOption): string {
    return interpolate(this.t().simulator.cuts.perMonth, { amount: formatMoney(option.monthly) });
  }

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  protected toggle(id: string, checked: boolean): void {
    this.toggled.emit({ id, checked });
  }
}
