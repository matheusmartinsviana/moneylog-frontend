import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type {
  PurchaseGroup,
  PurchaseGroupMember,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { formatCompetence, formatIsoDate } from '~/util/date';
import { formatMoney, type Money } from '~/util/money';

export interface UnlinkRequest {
  readonly group: PurchaseGroup;
  readonly member: PurchaseGroupMember;
}

@Component({
  selector: 'li[app-purchase-group-card]',
  imports: [MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[attr.data-cy]': "'purchase-group-' + group().id" },
  template: `
    @let g = group();
    <div class="head">
      <div class="head__title">
        <h3 class="name" [attr.data-cy]="'purchase-group-name-' + g.id">{{ g.name }}</h3>
        @if (g.interest) {
          <span class="tag" [attr.data-cy]="'purchase-group-interest-' + g.id">{{
            t().purchaseGroups.group.interest
          }}</span>
        }
        @if (g.status === 'DONE') {
          <span class="tag" [attr.data-cy]="'purchase-group-done-' + g.id">{{
            t().purchaseGroups.group.done
          }}</span>
        }
      </div>
      <p class="end" [attr.data-cy]="'purchase-group-end-' + g.id">{{ endText() }}</p>
    </div>

    <dl class="facts">
      <div class="fact">
        <dt>{{ t().purchaseGroups.group.total }}</dt>
        <dd [attr.data-cy]="'purchase-group-total-' + g.id"><app-money [value]="g.total" /></dd>
      </div>
      <div class="fact">
        <dt>{{ t().purchaseGroups.group.remaining }}</dt>
        <dd [attr.data-cy]="'purchase-group-remaining-' + g.id">
          <app-money [value]="g.remaining" />
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t().purchaseGroups.group.myRemaining }}</dt>
        <dd [attr.data-cy]="'purchase-group-mine-' + g.id">
          <app-money [value]="g.myRemaining" />
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t().purchaseGroups.group.perMonth }}</dt>
        <dd [attr.data-cy]="'purchase-group-per-month-' + g.id">
          <app-money [value]="g.installmentAmountPerMonth" />
        </dd>
      </div>
    </dl>

    @if (g.divergence; as divergence) {
      <div class="divergence" role="status" [attr.data-cy]="'purchase-group-divergence-' + g.id">
        <p class="divergence__title">{{ t().purchaseGroups.divergence.title }}</p>
        <p class="note">
          {{ divergenceText() }}
        </p>
        <p class="note">{{ t().purchaseGroups.divergence.note }}</p>
      </div>
    }

    <div class="actions quiet-actions">
      <button
        type="button"
        class="button"
        [attr.data-cy]="'purchase-group-toggle-' + g.id"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="'purchase-group-members-' + g.id"
        [attr.aria-label]="toggleLabel()"
        (click)="open.set(!open())"
      >
        {{ t().purchaseGroups.group.members }} ({{ g.members.length }})
      </button>
      <button
        type="button"
        class="button"
        [attr.data-cy]="'purchase-group-link-' + g.id"
        [disabled]="busy()"
        (click)="linkRequested.emit(g)"
      >
        {{ t().purchaseGroups.group.link }}
      </button>
      <button
        type="button"
        class="button"
        [attr.data-cy]="'purchase-group-edit-' + g.id"
        [disabled]="busy()"
        (click)="editRequested.emit(g)"
      >
        {{ t().purchaseGroups.group.edit }}
      </button>
    </div>

    @if (open()) {
      <ul class="members" [id]="'purchase-group-members-' + g.id">
        @for (member of g.members; track member.transactionId) {
          <li class="member" [attr.data-cy]="'purchase-member-' + member.transactionId">
            <div class="member__main">
              <p class="member__title">
                {{ member.description || t().purchaseGroups.member.noDescription }}
              </p>
              <p class="note">
                {{ member.card.name }} ·
                {{ installmentsText(member) }}
              </p>
              @if (lastDue(member); as text) {
                <p class="note">{{ text }}</p>
              }
            </div>
            <dl class="member__values">
              <div class="fact">
                <dt>{{ t().purchaseGroups.member.perInstallment }}</dt>
                <dd><app-money [value]="member.installmentAmount" /></dd>
              </div>
              <div class="fact">
                <dt>{{ t().purchaseGroups.member.total }}</dt>
                <dd><app-money [value]="member.total" /></dd>
              </div>
              <div class="fact">
                <dt>{{ t().purchaseGroups.member.remaining }}</dt>
                <dd><app-money [value]="member.remaining" /></dd>
              </div>
            </dl>
            <button
              type="button"
              class="button"
              [attr.data-cy]="'purchase-member-unlink-' + member.transactionId"
              [attr.aria-label]="unlinkLabel(member)"
              [disabled]="busy()"
              (click)="unlinkRequested.emit({ group: g, member })"
            >
              {{ t().purchaseGroups.member.unlink }}
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host(.card) {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-card);
      background-color: var(--card-flat-bg);
      list-style: none;
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .head__title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    .name {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      overflow-wrap: anywhere;
    }

    .end {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .tag {
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-pill);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }

    .facts,
    .member__values {
      display: grid;
      gap: var(--space-2);
      margin: 0;
    }

    .fact {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .fact dt {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .fact dd {
      margin: 0;
      font-weight: var(--weight-semibold);
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .divergence {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-3);
      border: var(--border-width) solid var(--color-warning);
      border-radius: var(--radius-control);
    }

    .divergence__title {
      margin: 0;
      font-weight: var(--weight-medium);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .members {
      display: grid;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .member {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-3);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-control);
    }

    .member__main {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    .member__title {
      margin: 0;
      font-weight: var(--weight-medium);
      overflow-wrap: anywhere;
    }

    @media (width >= 768px) {
      .facts {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .facts .fact {
        display: grid;
        gap: var(--space-1);
      }

      .member {
        grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) auto;
        align-items: center;
      }
    }
  `,
})
export class PurchaseGroupCardComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly group = input.required<PurchaseGroup>();
  readonly busy = input(false);
  readonly editRequested = output<PurchaseGroup>();
  readonly linkRequested = output<PurchaseGroup>();
  readonly unlinkRequested = output<UnlinkRequest>();

  protected readonly open = signal(false);
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly endText = computed(() => {
    const last = this.group().lastDueDate;
    return last === null
      ? this.t().purchaseGroups.group.noPending
      : interpolate(this.t().purchaseGroups.group.endsIn, {
          month: formatCompetence(last.slice(0, 7), this.locale()),
        });
  });
  protected readonly toggleLabel = computed(() =>
    interpolate(this.t().purchaseGroups.group.openMembers, { name: this.group().name }),
  );
  protected readonly divergenceText = computed(() => {
    const divergence = this.group().divergence;
    if (divergence === null) return '';
    return interpolate(this.t().purchaseGroups.divergence.text, {
      declared: this.moneyText(divergence.declared),
      computed: this.moneyText(divergence.computed),
      difference: this.moneyText(divergence.difference),
    });
  });

  protected installmentsText(member: PurchaseGroupMember): string {
    return interpolate(this.t().purchaseGroups.member.installments, {
      remaining: String(member.remainingInstallments),
      total: String(member.totalInstallments),
    });
  }

  protected lastDue(member: PurchaseGroupMember): string | null {
    return member.lastDueDate === null
      ? null
      : interpolate(this.t().purchaseGroups.member.lastDue, {
          date: formatIsoDate(member.lastDueDate, this.locale(), 'long'),
        });
  }

  protected unlinkLabel(member: PurchaseGroupMember): string {
    return interpolate(this.t().purchaseGroups.member.unlinkAria, {
      name: member.description || this.t().purchaseGroups.member.noDescription,
    });
  }

  private moneyText(value: Money): string {
    return formatMoney(value);
  }
}
