import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { QuickEntryToken } from '~/modules/quick-entry/core/types/quick-entry-token';
import { formatInstant } from '~/util/date';

@Component({
  selector: 'li[app-token-row]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './token-row.component.html',
  styleUrl: './token-row.component.css',
  host: {
    class: 'row',
    '[attr.data-cy]': "'token-row-' + token().id",
  },
})
export class TokenRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly token = input.required<QuickEntryToken>();
  readonly busy = input(false);

  readonly rename = output<QuickEntryToken>();
  readonly revoke = output<QuickEntryToken>();

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly canAct = computed(() => this.token().status === 'ACTIVE');
  protected readonly accountText = computed(() =>
    interpolate(this.t().quickEntry.list.account, { account: this.token().accountName }),
  );
  protected readonly prefixText = computed(() =>
    interpolate(this.t().quickEntry.list.prefix, { prefix: this.token().prefix }),
  );
  protected readonly datesText = computed(() => {
    const token = this.token();
    const copy = this.t().quickEntry.list;
    const created = interpolate(copy.createdAt, {
      when: formatInstant(token.createdAt, this.locale()),
    });
    if (token.status === 'REVOKED') {
      const revoked =
        token.revokedReason === 'USER_DISABLED'
          ? copy.revokedByAccess
          : interpolate(copy.revokedAt, {
              when: formatInstant(token.revokedAt ?? token.expiresAt, this.locale()),
            });
      return `${created} · ${revoked}`;
    }
    const expiry = interpolate(token.status === 'EXPIRED' ? copy.expiredAt : copy.expiresAt, {
      when: formatInstant(token.expiresAt, this.locale()),
    });
    return `${created} · ${expiry}`;
  });
  protected readonly usageText = computed(() => {
    const token = this.token();
    const copy = this.t().quickEntry.list;
    if (token.lastUsedAt === null) return copy.neverUsed;
    return interpolate(copy.lastUsed, { when: formatInstant(token.lastUsedAt, this.locale()) });
  });
  protected readonly ipText = computed(() => {
    const ip = this.token().lastUsedIp;
    return ip === null ? null : interpolate(this.t().quickEntry.list.lastUsedIp, { ip });
  });
  protected readonly agentText = computed(() => {
    const agent = this.token().lastUsedUserAgent;
    return agent === null || agent === ''
      ? null
      : interpolate(this.t().quickEntry.list.lastUsedAgent, { agent });
  });
  protected readonly actionsLabel = computed(() =>
    interpolate(this.t().quickEntry.list.rowActions, { label: this.token().label }),
  );
}
