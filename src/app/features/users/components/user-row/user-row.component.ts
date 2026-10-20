import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { ManagedUser } from '~/modules/users/core/types/access';
import { formatInstant } from '~/util/date';

@Component({
  selector: 'li[app-user-row]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-row.component.html',
  styleUrl: './user-row.component.css',
  host: {
    class: 'row',
    '[attr.data-cy]': "'user-row-' + user().id",
  },
})
export class UserRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly user = input.required<ManagedUser>();
  readonly isSelf = input(false);
  readonly busy = input(false);

  readonly disable = output<ManagedUser>();
  readonly enable = output<ManagedUser>();

  protected readonly canDisable = computed(
    () => this.user().role !== 'OWNER' && !this.isSelf() && this.user().status === 'ACTIVE',
  );
  protected readonly canEnable = computed(() => this.user().status === 'DISABLED');
  protected readonly lastAccess = computed(() => {
    const at = this.user().lastLoginAt;
    const copy = this.t().access.users.people;
    return at === null
      ? copy.neverAccessed
      : interpolate(copy.lastAccess, { when: formatInstant(at, HTML_LANG[this.i18n.language()]) });
  });
  protected readonly actionsLabel = computed(() =>
    interpolate(this.t().access.users.rowActions, { email: this.user().email }),
  );
}
