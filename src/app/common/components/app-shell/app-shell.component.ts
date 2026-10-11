import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BottomNavComponent } from '~/app/common/components/app-shell/bottom-nav/bottom-nav.component';
import { SidebarComponent } from '~/app/common/components/app-shell/sidebar/sidebar.component';
import { ToastRegionComponent } from '~/app/common/components/toast/toast-region.component';
import { WorkspaceHeaderComponent } from '~/app/common/components/workspace-header/workspace-header.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { captureInstallPrompt } from '~/app/common/services/install-prompt-capture';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    SidebarComponent,
    BottomNavComponent,
    ToastRegionComponent,
    WorkspaceHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  constructor() {
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => (destroyed = true));
    captureInstallPrompt(this.document.defaultView);
    afterNextRender(() => {
      void import('~/app/common/components/pwa-notices/pwa-notices.component').then((m) => {
        if (!destroyed) this.pwaNotices()?.createComponent(m.PwaNoticesComponent);
      });
    });
  }

  private readonly document = inject(DOCUMENT);
  protected readonly t = inject(I18nService).t;
  private readonly pwaNotices = viewChild('pwaNotices', { read: ViewContainerRef });

  protected skipToContent(): void {
    this.document.getElementById('main-content')?.focus();
  }
}
