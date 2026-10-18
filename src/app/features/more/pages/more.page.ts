import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MORE_GROUPS, visibleGroups } from '~/app/common/components/app-shell/navigation';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { AiStatusFacade } from '~/modules/ai/core/facades/ai-status.facade';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';

@Component({
  selector: 'app-more-page',
  imports: [PageLayoutComponent, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './more.page.html',
  styleUrl: './more.page.css',
})
export class MorePage {
  protected readonly t = inject(I18nService).t;
  protected readonly aiStatus = inject(AiStatusFacade);
  private readonly session = inject(SessionFacade);
  protected readonly groups = computed(() => visibleGroups(MORE_GROUPS, this.session.isOwner()));

  constructor() {
    if (this.session.isOwner()) this.aiStatus.ensureLoaded();
  }
}
