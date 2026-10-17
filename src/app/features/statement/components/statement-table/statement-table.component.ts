import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import type { StatementMonth } from '~/modules/owner-statement/core/types/owner-statement';
import { formatCompetence, formatIsoDate } from '~/util/date';

@Component({
  selector: 'app-statement-table',
  imports: [IconComponent, MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statement-table.component.html',
  styleUrl: './statement-table.component.css',
})
export class StatementTableComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  readonly months = input.required<readonly StatementMonth[]>();
  readonly showGross = input(false);

  protected readonly columns = computed(() =>
    this.months().map((month) => ({
      month,
      label: formatCompetence(month.competence, this.locale()),
    })),
  );

  protected dateLabel(value: string): string {
    return formatIsoDate(value, this.locale());
  }

  protected hasAmount(amount: string): boolean {
    return Number(amount) !== 0;
  }
}
