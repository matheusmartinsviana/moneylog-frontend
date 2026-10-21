import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { OverlayPanelComponent } from '~/app/common/components/overlay/overlay-panel.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { PomodoroService } from '~/app/features/home/components/pomodoro-card/pomodoro.service';
import { PomodoroClockComponent } from '~/app/features/home/components/pomodoro-clock/pomodoro-clock.component';

@Component({
  selector: 'app-pomodoro-focus',
  imports: [OverlayPanelComponent, IconComponent, PomodoroClockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pomodoro-focus.component.html',
  styleUrl: './pomodoro-focus.component.css',
})
export class PomodoroFocusComponent {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly pomodoro = inject(PomodoroService);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly today = computed(() => {
    this.open();
    const locale = this.i18n.language() === 'en' ? 'en-GB' : HTML_LANG[this.i18n.language()];
    const parts = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).formatToParts(new Date());
    return ['weekday', 'day', 'month']
      .map((type) => parts.find((part) => part.type === type)?.value.replace('.', '') ?? '')
      .join(' ');
  });

  protected readonly fullscreen = signal(false);
  protected readonly fullscreenAvailable = computed(
    () => typeof this.document.documentElement.requestFullscreen === 'function',
  );

  constructor() {
    const sync = () => this.fullscreen.set(this.document.fullscreenElement != null);
    this.document.addEventListener('fullscreenchange', sync);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', sync);
      this.leaveFullscreen();
    });
    effect(() => {
      const open = this.open();
      untracked(() => this.pomodoro.focusOpen.set(open));
      if (!open) untracked(() => this.leaveFullscreen());
    });
    inject(DestroyRef).onDestroy(() => this.pomodoro.focusOpen.set(false));
  }

  protected async toggleFullscreen(): Promise<void> {
    try {
      if (this.document.fullscreenElement) await this.document.exitFullscreen();
      else await this.document.documentElement.requestFullscreen();
    } catch {
      return;
    }
  }

  private leaveFullscreen(): void {
    if (!this.document.fullscreenElement) return;
    void this.document.exitFullscreen().catch(() => undefined);
  }
}
