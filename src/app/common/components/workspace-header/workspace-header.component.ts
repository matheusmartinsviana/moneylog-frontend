import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { GlobalSearchComponent } from '~/app/common/components/global-search/global-search.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { LiquidGlassDirective } from '~/app/common/components/liquid-glass/liquid-glass.directive';
import { ProfileMenuComponent } from '~/app/common/components/profile-menu/profile-menu.component';
import { TooltipDirective } from '~/app/common/components/tooltip/tooltip.directive';
import { ValuesToggleComponent } from '~/app/common/components/values-toggle/values-toggle.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { ThemeService } from '~/app/common/services/theme.service';
import { NotificationsPopoverComponent } from '~/app/features/notifications/components/notifications-popover.component';
import { UnreadCountFacade } from '~/modules/notifications/core/facades/unread-count.facade';

export const GREETING_HOUR = new InjectionToken<() => number>('GREETING_HOUR', {
  providedIn: 'root',
  factory: () => () => new Date().getHours(),
});

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

@Component({
  selector: 'app-workspace-header',
  imports: [
    GlobalSearchComponent,
    IconComponent,
    LiquidGlassDirective,
    NotificationsPopoverComponent,
    ProfileMenuComponent,
    RouterLink,
    TooltipDirective,
    ValuesToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-header.component.html',
  styleUrl: './workspace-header.component.css',
})
export class WorkspaceHeaderComponent {
  protected readonly t = inject(I18nService).t;
  private readonly unread = inject(UnreadCountFacade);

  private readonly theme = inject(ThemeService);
  protected readonly themeIcon = computed(() =>
    this.theme.effective() === 'dark' ? 'moon' : 'sun',
  );
  protected readonly themeLabel = computed(() => {
    const copy = this.t().header.theme;
    return this.theme.effective() === 'dark' ? copy.toLight : copy.toDark;
  });

  protected cycleTheme(): void {
    this.theme.set(this.theme.effective() === 'dark' ? 'light' : 'dark');
  }

  constructor() {
    this.unread.connect(inject(DestroyRef));
  }
}
