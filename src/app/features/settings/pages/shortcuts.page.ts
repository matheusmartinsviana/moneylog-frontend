import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

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
import { ShortcutGuideComponent } from '~/app/features/settings/components/shortcut-guide/shortcut-guide.component';
import { TokenGenerateFormComponent } from '~/app/features/settings/components/token-generate-form/token-generate-form.component';
import { TokenRenameDialogComponent } from '~/app/features/settings/components/token-rename-dialog/token-rename-dialog.component';
import { TokenRowComponent } from '~/app/features/settings/components/token-row/token-row.component';
import { TokenSecretDialogComponent } from '~/app/features/settings/components/token-secret-dialog/token-secret-dialog.component';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import type { Account } from '~/modules/accounts/core/types/account';
import {
  QuickEntryTokensFacade,
  type TokenNotice,
} from '~/modules/quick-entry/core/facades/quick-entry-tokens.facade';
import type { QuickEntryToken } from '~/modules/quick-entry/core/types/quick-entry-token';

const ELIGIBLE_ACCOUNT_TYPES: ReadonlySet<Account['type']> = new Set([
  'CHECKING',
  'SAVINGS',
  'WALLET',
]);

@Component({
  selector: 'app-shortcuts-page',
  imports: [
    RouterLink,
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    ShortcutGuideComponent,
    TokenGenerateFormComponent,
    TokenRenameDialogComponent,
    TokenRowComponent,
    TokenSecretDialogComponent,
  ],
  providers: [QuickEntryTokensFacade, AccountsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shortcuts.page.html',
  styleUrl: './shortcuts.page.css',
})
export class ShortcutsPage {
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  protected readonly t = inject(I18nService).t;
  protected readonly tokens = inject(QuickEntryTokensFacade);
  protected readonly accountsList = inject(AccountsListFacade);

  protected readonly pendingRename = signal<QuickEntryToken | null>(null);
  protected readonly pendingRevoke = signal<QuickEntryToken | null>(null);
  protected readonly formResets = signal(0);

  protected readonly createProblem = computed(() => {
    const state = this.tokens.createState();
    return state.status === 'failed' ? state.problem : null;
  });
  protected readonly eligibleAccounts = computed<readonly Account[]>(
    () => this.accountsList.data()?.filter((a) => ELIGIBLE_ACCOUNT_TYPES.has(a.type)) ?? [],
  );
  protected readonly accountsReady = computed(
    () => this.accountsList.data() !== null || this.accountsList.empty(),
  );
  protected readonly renaming = computed(() => {
    const token = this.pendingRename();
    return token !== null && this.tokens.busyIds().has(token.id);
  });
  protected readonly revokeTitle = computed(() =>
    interpolate(this.t().quickEntry.revokeConfirm.title, {
      label: this.pendingRevoke()?.label ?? '',
    }),
  );
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => [
    { id: 'generate', label: this.t().quickEntry.list.emptyAction, available: true, primary: true },
  ]);
  protected readonly noAccountsActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'accounts',
      label: this.t().quickEntry.generate.noAccountsAction,
      available: true,
      primary: true,
    },
  ]);

  constructor() {
    this.tokens.load();
    this.accountsList.load('ACTIVE');
    this.tokens.notices$.pipe(takeUntilDestroyed()).subscribe((notice) => this.announce(notice));
  }

  protected generate(input: Parameters<QuickEntryTokensFacade['create']>[0]): void {
    this.tokens.create(input);
  }

  protected focusForm(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[data-cy="token-label"]')?.focus();
  }

  protected openAccounts(): void {
    void this.router.navigate(['/accounts']);
  }

  protected askRename(token: QuickEntryToken): void {
    this.pendingRename.set(token);
  }

  protected confirmRename(label: string): void {
    const token = this.pendingRename();
    if (token) this.tokens.rename(token.id, label);
  }

  protected askRevoke(token: QuickEntryToken): void {
    this.pendingRevoke.set(token);
  }

  protected confirmRevoke(): void {
    const token = this.pendingRevoke();
    this.pendingRevoke.set(null);
    if (token) this.tokens.revoke(token.id);
  }

  private announce(notice: TokenNotice): void {
    const copy = this.t().quickEntry;
    switch (notice.kind) {
      case 'created':
        this.formResets.update((count) => count + 1);
        break;
      case 'renamed':
        this.pendingRename.set(null);
        this.toast.show(copy.toast.renamed);
        break;
      case 'revoked':
        this.toast.show(copy.toast.revoked);
        break;
      case 'failed':
        this.pendingRename.set(null);
        this.toast.show(problemMessage(notice.problem, this.t().errors), { tone: 'error' });
        break;
    }
  }
}
