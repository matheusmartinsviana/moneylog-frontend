import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { exhaustMap, Subject } from 'rxjs';

import { MenuComponent, MenuItem } from '~/app/common/components/menu/menu.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';

@Component({
  selector: 'app-profile-menu',
  imports: [MenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-menu
      [label]="t().header.profile.label"
      [fieldId]="cy()"
      [items]="items()"
      [avatar]="true"
      icon="user"
      [align]="align()"
      (selected)="onSelected($event)"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class ProfileMenuComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SessionFacade);
  private readonly signOuts = new Subject<void>();
  protected readonly t = inject(I18nService).t;

  readonly cy = input('profile-menu');
  readonly align = input<'start' | 'end'>('end');

  protected readonly items = computed<readonly MenuItem[]>(() => [
    { id: 'settings', label: this.t().nav.settings },
    { id: 'signOut', label: this.t().header.profile.signOut },
  ]);

  constructor() {
    this.signOuts
      .pipe(
        exhaustMap(() => this.session.logout()),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.router.navigate(['/login']));
  }

  protected onSelected(id: string): void {
    if (id === 'settings') void this.router.navigate(['/settings']);
    else if (id === 'signOut') this.signOuts.next();
  }
}
