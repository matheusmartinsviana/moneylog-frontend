import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { Invitation } from '~/modules/users/core/types/access';
import { formatInstant } from '~/util/date';

@Component({
  selector: 'li[app-invitation-row]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invitation-row.component.html',
  styleUrl: './invitation-row.component.css',
  host: {
    class: 'row',
    '[attr.data-cy]': "'invitation-row-' + invitation().id",
  },
})
export class InvitationRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly invitation = input.required<Invitation>();
  readonly busy = input(false);

  readonly resend = output<Invitation>();
  readonly revoke = output<Invitation>();

  protected readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly canAct = computed(() => {
    const status = this.invitation().status;
    return status === 'PENDING' || status === 'EXPIRED';
  });
  protected readonly deliveryFailed = computed(
    () => this.canAct() && this.invitation().deliveryStatus === 'FAILED',
  );
  protected readonly detail = computed(() => {
    const invitation = this.invitation();
    const copy = this.t().access.users.invitations;
    switch (invitation.status) {
      case 'PENDING':
        return interpolate(copy.validUntil, {
          when: formatInstant(invitation.expiresAt, this.locale()),
        });
      case 'EXPIRED':
        return interpolate(copy.expiredAt, {
          when: formatInstant(invitation.expiresAt, this.locale()),
        });
      case 'ACCEPTED':
        return interpolate(copy.acceptedAt, {
          when: formatInstant(invitation.acceptedAt ?? invitation.expiresAt, this.locale()),
        });
      case 'REVOKED':
        return copy.revokedHint;
    }
  });
  protected readonly actionsLabel = computed(() =>
    interpolate(this.t().access.users.rowActions, { email: this.invitation().email }),
  );
}
