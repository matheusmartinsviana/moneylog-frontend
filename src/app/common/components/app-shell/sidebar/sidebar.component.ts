import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { exhaustMap, filter, map, Subject } from 'rxjs';

import {
  isNavActive,
  NavItem,
  QUICK_ADD_ITEM,
  SIDEBAR_MAIN_ITEMS,
  SIDEBAR_MORE_ITEM,
  SIDEBAR_POPOVER_ITEMS,
  SIDEBAR_SETTINGS_ITEM,
  visibleItems,
} from '~/app/common/components/app-shell/navigation';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { MenuItem } from '~/app/common/components/menu/menu.component';
import { MenuComponent } from '~/app/common/components/menu/menu.component';
import { TooltipDirective } from '~/app/common/components/tooltip/tooltip.directive';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { AiStatusFacade } from '~/modules/ai/core/facades/ai-status.facade';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, IconComponent, MenuComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SessionFacade);
  private readonly aiStatus = inject(AiStatusFacade);
  private readonly injector = inject(Injector);
  private readonly signOuts = new Subject<void>();
  protected readonly t = inject(I18nService).t;
  protected readonly items = SIDEBAR_MAIN_ITEMS;
  protected readonly more = SIDEBAR_MORE_ITEM;
  protected readonly settings = SIDEBAR_SETTINGS_ITEM;
  protected readonly quickAdd = QUICK_ADD_ITEM;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly activeKey = computed<string | null>(() => {
    const url = this.url();
    if (isNavActive(this.quickAdd, url)) return this.quickAdd.key;
    const main = this.items.find((item) => isNavActive(item, url));
    if (main) return main.key;
    if (SIDEBAR_POPOVER_ITEMS.some((item) => isNavActive(item, url))) return this.more.key;
    return null;
  });
  protected readonly settingsActive = computed(() => isNavActive(this.settings, this.url()));

  protected readonly moreItems = computed<readonly MenuItem[]>(() =>
    visibleItems(SIDEBAR_POPOVER_ITEMS, this.session.isOwner()).map((item) => ({
      id: item.key,
      label:
        item.key === 'ai'
          ? `${this.t().nav.ai} (${this.aiStatus.enabled() ? this.t().shell.aiOn : this.t().shell.aiOff})`
          : this.t().nav[item.key],
      icon: item.icon,
    })),
  );

  private readonly scroll = viewChild<ElementRef<HTMLElement>>('scroll');
  protected readonly indicatorY = signal<number | null>(null);
  protected readonly indicatorReady = signal(false);

  constructor() {
    this.aiStatus.ensureLoaded();
    this.signOuts
      .pipe(
        exhaustMap(() => this.session.logout()),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.router.navigate(['/login']));

    effect(() => {
      this.activeKey();
      this.scroll();
      afterNextRender({ read: () => this.measure() }, { injector: this.injector });
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.scroll()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private measure(): void {
    const container = this.scroll()?.nativeElement;
    const key = this.activeKey();
    const target =
      container && key ? container.querySelector<HTMLElement>(`[data-nav-key="${key}"]`) : null;
    if (!target || target.offsetParent === null) {
      this.indicatorY.set(null);
      return;
    }
    const first = this.indicatorY() === null;
    this.indicatorY.set(target.offsetTop);
    if (first && !this.indicatorReady()) {
      requestAnimationFrame(() => this.indicatorReady.set(true));
    }
  }

  protected openMore(id: string): void {
    const item = SIDEBAR_POPOVER_ITEMS.find((candidate: NavItem) => candidate.key === id);
    if (item) void this.router.navigateByUrl(item.path);
  }

  protected signOut(): void {
    this.signOuts.next();
  }
}
