import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvatarComponent } from '~/app/common/components/avatar/avatar.component';
import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import {
  GREETING_HOUR,
  greetingPeriod,
} from '~/app/common/components/workspace-header/workspace-header.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { isNegative, type Money } from '~/util/money';

@Component({
  selector: 'app-wallet-header',
  imports: [
    AvatarComponent,
    GlassPanelComponent,
    IconComponent,
    MoneyComponent,
    NgTemplateOutlet,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wallet-header.component.html',
  styleUrl: './wallet-header.component.css',
})
export class WalletHeaderComponent {
  private readonly hour = inject(GREETING_HOUR);
  protected readonly t = inject(I18nService).t;

  readonly available = input.required<Money>();
  readonly displayName = input<string | null>(null);
  readonly photoUrl = input<string | null>(null);
  readonly embedded = input(false);
  readonly showAction = input(true);

  protected readonly negative = computed(() => isNegative(this.available()));
  protected readonly greeting = computed(() => {
    const salutation = this.t().header.greeting[greetingPeriod(this.hour())];
    const name = this.displayName()?.trim();
    if (!name) return salutation;
    return interpolate(this.t().home.wallet.greetingNamed, { greeting: salutation, name });
  });
}
