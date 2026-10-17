import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { IconName } from '~/app/common/components/icon/icons';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { ProvenanceBadgeComponent } from '~/app/common/components/provenance-badge/provenance-badge.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type {
  PurchaseSimulation,
  SimulationClassification,
} from '~/modules/simulations/core/types/simulation';
import { formatCompetence } from '~/util/date';

const CLASSIFICATION_ICON: Readonly<Record<SimulationClassification, IconName>> = {
  SUSTAINABLE: 'check',
  VIABLE_WITH_PLANNING: 'adjust',
  RISKY: 'time',
  INCOMPATIBLE: 'minus',
};

const SHOWN_ELSEWHERE: ReadonlySet<string> = new Set(['HORIZON_LIMITED', 'FINANCING_PENDING']);

@Component({
  selector: 'app-simulation-result',
  imports: [IconComponent, MoneyComponent, ProvenanceBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulation-result.component.html',
  styleUrl: './simulation-result.component.css',
})
export class SimulationResultComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  readonly result = input.required<PurchaseSimulation>();

  protected readonly classification = computed(() => {
    const kind = this.result().classification;
    const copy = this.t().simulator.classification;
    const entry = Object.hasOwn(copy, kind) ? copy[kind] : copy.RISKY;
    return { kind, icon: CLASSIFICATION_ICON[kind] ?? 'time', ...entry };
  });

  protected readonly withCuts = computed(() =>
    this.result().months.some((month) => month.surplusAfterWithCuts !== null),
  );

  protected readonly anyEstimated = computed(() =>
    this.result().months.some((month) => month.estimated),
  );

  protected readonly rows = computed(() =>
    this.result().months.map((month) => ({
      month,
      label: formatCompetence(month.competence, this.locale()),
    })),
  );

  protected readonly horizonText = computed(() => {
    const horizon = this.result().horizon;
    return interpolate(this.t().simulator.horizon, {
      calculated: String(horizon.calculatedMonths),
      required: String(horizon.requiredMonths),
      from: formatCompetence(horizon.from, this.locale()),
      to: formatCompetence(horizon.to, this.locale()),
    });
  });

  protected readonly reasons = computed(() => {
    const copy = this.t().simulator.reasons;
    return this.result()
      .reasons.filter((reason) => !SHOWN_ELSEWHERE.has(reason.code))
      .map((reason, index) => {
        const template = Object.hasOwn(copy, reason.code) ? copy[reason.code] : undefined;
        const month = reason.competence ? formatCompetence(reason.competence, this.locale()) : '';
        return {
          key: `${reason.code}-${reason.competence ?? index}`,
          text: interpolate(template ?? copy['unknown'] ?? '', { month }),
        };
      });
  });
}
