import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { InvitationRowComponent } from '~/app/features/users/components/invitation-row/invitation-row.component';
import { InviteFormComponent } from '~/app/features/users/components/invite-form/invite-form.component';
import { UserRowComponent } from '~/app/features/users/components/user-row/user-row.component';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import {
  AccessAdminFacade,
  type AccessNotice,
} from '~/modules/users/core/facades/access-admin.facade';
import type { Invitation, ManagedUser } from '~/modules/users/core/types/access';

@Component({
  selector: 'app-users-page',
  imports: [
    RouterLink,
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    InviteFormComponent,
    InvitationRowComponent,
    UserRowComponent,
  ],
  providers: [AccessAdminFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage {
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly session = inject(SessionFacade);
  protected readonly t = inject(I18nService).t;
  protected readonly admin = inject(AccessAdminFacade);

  protected readonly selfId = computed(() => this.session.user()?.id ?? null);
  protected readonly pendingDisable = signal<ManagedUser | null>(null);
  protected readonly pendingRevoke = signal<Invitation | null>(null);

  protected readonly inviteProblem = computed(() => {
    const state = this.admin.inviteState();
    return state.status === 'failed' ? state.problem : null;
  });
  protected readonly onlyOwner = computed(() => {
    const state = this.admin.users();
    return state.status === 'ready' && state.data.every((user) => user.role === 'OWNER');
  });
  protected readonly disableTitle = computed(() =>
    interpolate(this.t().access.users.people.disableConfirm.title, {
      email: this.pendingDisable()?.email ?? '',
    }),
  );
  protected readonly revokeTitle = computed(() =>
    interpolate(this.t().access.users.invitations.revokeConfirm.title, {
      email: this.pendingRevoke()?.email ?? '',
    }),
  );
  protected readonly emptyInvitationActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'invite',
      label: this.t().access.users.invitations.emptyAction,
      available: !this.admin.invitationsUnavailable(),
      primary: true,
    },
  ]);

  constructor() {
    this.admin.load();
    this.admin.notices$.pipe(takeUntilDestroyed()).subscribe((notice) => this.announce(notice));
  }

  protected askDisable(user: ManagedUser): void {
    this.pendingDisable.set(user);
  }

  protected confirmDisable(): void {
    const user = this.pendingDisable();
    this.pendingDisable.set(null);
    if (user) this.admin.disable(user.id);
  }

  protected askRevoke(invitation: Invitation): void {
    this.pendingRevoke.set(invitation);
  }

  protected confirmRevoke(): void {
    const invitation = this.pendingRevoke();
    this.pendingRevoke.set(null);
    if (invitation) this.admin.revoke(invitation.id);
  }

  protected focusInvite(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[data-cy="invite-email"]')?.focus();
  }

  private announce(notice: AccessNotice): void {
    const copy = this.t().access.users;
    switch (notice.kind) {
      case 'invited':
        this.toast.show(
          interpolate(copy.invitations.toast.invited, { email: notice.invitation.email }),
        );
        break;
      case 'resent':
        this.toast.show(
          interpolate(copy.invitations.toast.resent, { email: notice.invitation.email }),
        );
        break;
      case 'revoked':
        this.toast.show(
          interpolate(copy.invitations.toast.revoked, { email: notice.invitation.email }),
        );
        break;
      case 'disabled':
        this.toast.show(interpolate(copy.people.toast.disabled, { email: notice.user.email }));
        break;
      case 'enabled':
        this.toast.show(interpolate(copy.people.toast.enabled, { email: notice.user.email }));
        break;
      case 'failed':
        this.toast.show(problemMessage(notice.problem, this.t().errors), { tone: 'error' });
        break;
    }
  }
}
