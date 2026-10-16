import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import {
  GREETING_HOUR,
  greetingPeriod,
} from '~/app/common/components/workspace-header/workspace-header.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { PomodoroService } from '~/app/features/home/components/pomodoro-card/pomodoro.service';
import { PomodoroClockComponent } from '~/app/features/home/components/pomodoro-clock/pomodoro-clock.component';
import { PomodoroFocusComponent } from '~/app/features/home/components/pomodoro-focus/pomodoro-focus.component';

export {
  POMODORO_SECONDS,
  POMODORO_STORAGE_KEY,
} from '~/app/features/home/components/pomodoro-card/pomodoro.service';

@Component({
  selector: 'app-pomodoro-card',
  imports: [GlassPanelComponent, IconComponent, PomodoroClockComponent, PomodoroFocusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pomodoro-card.component.html',
  styleUrl: './pomodoro-card.component.css',
})
export class PomodoroCardComponent {
  private readonly hour = inject(GREETING_HOUR);
  protected readonly t = inject(I18nService).t;
  protected readonly pomodoro = inject(PomodoroService);

  readonly displayName = input<string | null>(null);

  protected readonly focusOpen = signal(false);

  protected readonly greeting = computed(() => {
    const salutation = this.t().header.greeting[greetingPeriod(this.hour())];
    const name = this.displayName()?.trim();
    if (!name) return salutation;
    return interpolate(this.t().home.wallet.greetingNamed, { greeting: salutation, name });
  });
}
