import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { pt } from '~/app/common/i18n/translations/pt';
import { ClipboardService } from '~/app/common/services/clipboard.service';
import { ToastService } from '~/app/common/services/toast.service';
import { ShortcutsPage } from '~/app/features/settings/pages/shortcuts.page';
import {
  anAccount,
  AccountsGatewayStub,
  failWith,
  provideAccountsStub,
} from '~/testing/accounts-testing';
import { AuthGatewayStub, provideAuthStub } from '~/testing/auth-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aQuickToken,
  provideQuickEntryStub,
  QuickEntryGatewayStub,
  TEST_SECRET,
} from '~/testing/quick-entry-testing';

class ClipboardStub {
  readonly written: string[] = [];
  succeed = true;

  copy(text: string): Promise<boolean> {
    if (this.succeed) this.written.push(text);
    return Promise.resolve(this.succeed);
  }
}

function accountsStub() {
  const accounts = new AccountsGatewayStub();
  accounts.accounts = [
    anAccount({ id: 'acc-1', name: 'Carteira', type: 'WALLET' }),
    anAccount({ id: 'acc-2', name: 'Corretora', type: 'INVESTMENT', liquidity: 'INVESTMENT' }),
  ];
  return accounts;
}

async function setup(
  stub = new QuickEntryGatewayStub(),
  accounts: AccountsGatewayStub = accountsStub(),
) {
  const clipboard = new ClipboardStub();
  const result = await render(ShortcutsPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideAuthStub(new AuthGatewayStub()),
      provideQuickEntryStub(stub),
      provideAccountsStub(accounts),
      { provide: ClipboardService, useValue: clipboard },
    ],
  });
  return { ...result, stub, clipboard, toast: TestBed.inject(ToastService) };
}

async function fillAndSubmit(label = 'iPhone novo') {
  await userEvent.type(screen.getByTestId('token-label'), label);
  await userEvent.click(screen.getByTestId('token-account'));
  await userEvent.click(screen.getByTestId('token-account-option-acc-1'));
  await userEvent.click(screen.getByTestId('token-submit'));
}

describe('ShortcutsPage', () => {
  it('Dado tokens existentes, então lista rótulo, prefixo, conta, datas, último uso com IP mascarado e status', async () => {
    const stub = new QuickEntryGatewayStub();
    stub.tokens = [
      aQuickToken({
        id: 'a',
        lastUsedAt: '2026-10-21T15:00:00Z',
        lastUsedIp: '187.12.34.0',
        lastUsedUserAgent: 'Atalhos/7.0',
      }),
      aQuickToken({
        id: 'b',
        label: 'iPad antigo',
        status: 'REVOKED',
        revokedAt: '2026-10-20T12:00:00Z',
        revokedReason: 'USER',
        createdAt: '2026-10-01T12:00:00Z',
      }),
      aQuickToken({
        id: 'c',
        label: 'Vencido',
        status: 'EXPIRED',
        createdAt: '2026-09-01T12:00:00Z',
      }),
    ];
    await setup(stub);

    expect(screen.getByTestId('token-label-a')).toHaveTextContent('iPhone do Matheus');
    expect(screen.getByTestId('token-status-a')).toHaveTextContent('Ativo');
    expect(screen.getByTestId('token-account-a')).toHaveTextContent('Conta: Carteira');
    expect(screen.getByTestId('token-account-a')).toHaveTextContent('Começa com TESTE001');
    expect(screen.getByTestId('token-dates-a')).toHaveTextContent('Criado em');
    expect(screen.getByTestId('token-dates-a')).toHaveTextContent('Expira em');
    expect(screen.getByTestId('token-usage-a')).toHaveTextContent('Último uso em');
    expect(screen.getByTestId('token-ip-a')).toHaveTextContent('IP 187.12.34.0');
    expect(screen.getByTestId('token-agent-a')).toHaveTextContent('Enviado por Atalhos/7.0');
    expect(screen.getByTestId('token-status-b')).toHaveTextContent('Revogado');
    expect(screen.getByTestId('token-dates-b')).toHaveTextContent('Revogado em');
    expect(screen.getByTestId('token-status-c')).toHaveTextContent('Expirado');
    expect(screen.getByTestId('token-dates-c')).toHaveTextContent('Expirou em');
    expect(screen.queryByTestId('token-revoke-b')).toBeNull();
    expect(screen.queryByTestId('token-revoke-c')).toBeNull();
    expect(screen.getByTestId('token-revoke-a')).toBeInTheDocument();
  });

  it('Dado um user agent com HTML, então aparece como texto e nada é interpretado', async () => {
    const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    const stub = new QuickEntryGatewayStub();
    stub.tokens = [
      aQuickToken({ id: 'a', lastUsedAt: '2026-10-21T15:00:00Z', lastUsedUserAgent: hostile }),
    ];
    const { container } = await setup(stub);

    expect(screen.getByTestId('token-agent-a')).toHaveTextContent(hostile);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('Dado nenhum token, então mostra o vazio com ação que leva ao formulário', async () => {
    await setup();

    const empty = screen.getByTestId('shortcuts-empty');
    expect(empty).toHaveTextContent('Nenhum token.');
    expect(empty).toHaveTextContent('Gere um para usar o atalho.');

    await userEvent.click(screen.getByTestId('empty-state-action-generate'));

    expect(screen.getByTestId('token-label')).toHaveFocus();
  });

  it('Dado carregando, então mostra o estado de carregamento', async () => {
    const stub = new QuickEntryGatewayStub();
    stub.listResult = NEVER;
    await setup(stub);

    expect(screen.getByTestId('shortcuts-loading')).toBeInTheDocument();
  });

  it('Dado erro na lista, então mostra a mensagem do catálogo e tentar de novo recarrega', async () => {
    const stub = new QuickEntryGatewayStub();
    stub.listResult = failWith(500, 'INTERNAL_ERROR');
    await setup(stub);
    const error = screen.getByTestId('shortcuts-error');
    stub.listResult = null;
    stub.tokens = [aQuickToken({ id: 'a' })];

    await userEvent.click(within(error).getByTestId('empty-state-action-retry'));

    expect(screen.getByTestId('shortcuts-list')).toBeInTheDocument();
    expect(screen.queryByTestId('shortcuts-error')).toBeNull();
  });

  it('Dado 403, então mostra sem permissão em vez dos dados', async () => {
    const stub = new QuickEntryGatewayStub();
    stub.listResult = failWith(403, 'FORBIDDEN');
    await setup(stub);

    expect(screen.getByTestId('shortcuts-forbidden')).toHaveTextContent(
      pt.quickEntry.forbidden.title,
    );
    expect(screen.queryByTestId('token-form')).toBeNull();
    expect(screen.queryByTestId('shortcut-guide')).toBeNull();
  });

  it('Dado a página pronta, então mostra o guia do toque duplo', async () => {
    await setup();

    expect(screen.getByTestId('shortcut-guide')).toBeInTheDocument();
    expect(screen.getByTestId('shortcut-guide-steps').querySelectorAll('li')).toHaveLength(7);
  });

  it('Dado que não há conta elegível (só investimento), então explica e leva às contas', async () => {
    const accounts = new AccountsGatewayStub();
    accounts.accounts = [anAccount({ id: 'x', type: 'INVESTMENT', liquidity: 'INVESTMENT' })];
    const { fixture } = await setup(new QuickEntryGatewayStub(), accounts);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(screen.getByTestId('shortcuts-no-accounts')).toBeInTheDocument();
    expect(screen.queryByTestId('token-form')).toBeNull();
    await userEvent.click(screen.getByTestId('empty-state-action-accounts'));
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/accounts']);
  });

  it('Dado erro ao carregar contas, então oferece tentar de novo', async () => {
    const accounts = accountsStub();
    accounts.listError = failWith(500, 'INTERNAL_ERROR');
    await setup(new QuickEntryGatewayStub(), accounts);

    expect(screen.getByTestId('shortcuts-accounts-error')).toBeInTheDocument();
  });

  describe('gerar', () => {
    it('Dado o formulário só com contas elegíveis, então a conta de investimento não é oferecida', async () => {
      await setup();

      await userEvent.click(screen.getByTestId('token-account'));

      expect(screen.getByTestId('token-account-option-acc-1')).toBeInTheDocument();
      expect(screen.queryByTestId('token-account-option-acc-2')).toBeNull();
    });

    it('Dado nome vazio, quando envia, então não chama o backend e não mostra segredo', async () => {
      const { stub } = await setup();

      await userEvent.click(screen.getByTestId('token-submit'));

      expect(stub.created).toEqual([]);
      expect(screen.queryByTestId('token-secret')).toBeNull();
    });

    it('Dado nome e conta, quando confirma, então chama uma vez com validade padrão de 30 dias e abre o diálogo com o token e o aviso', async () => {
      const { stub } = await setup();

      await fillAndSubmit('  iPhone novo ');

      expect(stub.created).toEqual([
        { label: 'iPhone novo', accountId: 'acc-1', expiresInDays: 30 },
      ]);
      expect(screen.getByTestId('token-secret')).toHaveTextContent(TEST_SECRET);
      expect(screen.getByTestId('token-secret-warning')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveTextContent(pt.quickEntry.secret.description);
      expect(screen.getByTestId('token-label-tok-new')).toHaveTextContent('iPhone novo');
    });

    it('Dado envio em andamento, então o botão fica desabilitado e um segundo clique não chama de novo', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.createResult = NEVER;
      await setup(stub);

      await fillAndSubmit();
      await userEvent.click(screen.getByTestId('token-submit'));

      expect(screen.getByTestId('token-submit')).toBeDisabled();
      expect(stub.created).toHaveLength(1);
    });

    it('Dado o diálogo, quando copia, então usa a área de transferência e confirma; se falhar, orienta a copiar à mão', async () => {
      const { clipboard } = await setup();
      await fillAndSubmit();

      await userEvent.click(screen.getByTestId('token-copy'));

      expect(clipboard.written).toEqual([TEST_SECRET]);
      expect(screen.getByTestId('token-copy-feedback')).toHaveTextContent(
        pt.quickEntry.secret.copied,
      );

      clipboard.succeed = false;
      await userEvent.click(screen.getByTestId('token-copy'));

      expect(screen.getByTestId('token-copy-failed')).toBeInTheDocument();
    });

    it('Dado o diálogo fechado, então o token não está no DOM, em storage, na URL nem em log, e a lista não o tem', async () => {
      const logs = [
        vi.spyOn(console, 'log'),
        vi.spyOn(console, 'info'),
        vi.spyOn(console, 'warn'),
        vi.spyOn(console, 'error'),
      ];
      const { container } = await setup();
      await fillAndSubmit();
      expect(screen.getByTestId('token-secret')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('token-secret-close'));

      expect(screen.queryByTestId('token-secret')).toBeNull();
      expect(document.body.textContent).not.toContain(TEST_SECRET);
      expect(container.innerHTML).not.toContain(TEST_SECRET);
      expect(JSON.stringify({ ...localStorage })).not.toContain(TEST_SECRET);
      expect(JSON.stringify({ ...sessionStorage })).not.toContain(TEST_SECRET);
      expect(globalThis.location.href).not.toContain(TEST_SECRET);
      expect(JSON.stringify(logs.map((spy) => spy.mock.calls))).not.toContain(TEST_SECRET);
      expect(screen.getByTestId('token-row-tok-new')).toBeInTheDocument();
    });

    it('Dado 409 de limite, então mostra a mensagem do catálogo, sem texto cru do servidor, e recarrega a lista', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.createResult = failWith(409, 'QUICK_TOKEN_LIMIT_REACHED');
      await setup(stub);

      await fillAndSubmit();

      expect(screen.getByTestId('token-error')).toHaveTextContent(
        pt.errors.codes['QUICK_TOKEN_LIMIT_REACHED']!,
      );
      expect(screen.queryByTestId('token-secret')).toBeNull();
      expect(stub.calls.filter((call) => call === 'list')).toHaveLength(2);
    });

    it.each(['QUICK_ACCOUNT_NOT_ALLOWED', 'ACCOUNT_NOT_FOUND'])(
      'Dado %s ao gerar, então recarrega as contas do select',
      async (code) => {
        const stub = new QuickEntryGatewayStub();
        const accounts = accountsStub();
        stub.createResult = failWith(code === 'ACCOUNT_NOT_FOUND' ? 404 : 422, code);
        await setup(stub, accounts);
        const before = accounts.queries.length;

        await fillAndSubmit();

        expect(accounts.queries.length).toBeGreaterThan(before);
      },
    );

    it.each([
      [422, 'QUICK_ACCOUNT_NOT_ALLOWED', pt.errors.codes['QUICK_ACCOUNT_NOT_ALLOWED']],
      [401, 'UNAUTHENTICATED', pt.errors.codes['UNAUTHENTICATED']],
      [429, 'TOO_MANY_ATTEMPTS', pt.errors.codes['TOO_MANY_ATTEMPTS']],
      [0, 'NETWORK', pt.errors.network],
    ])('Dado erro %s %s, então mostra a mensagem do catálogo', async (status, code, expected) => {
      const stub = new QuickEntryGatewayStub();
      stub.createResult = failWith(status, code);
      await setup(stub);

      await fillAndSubmit();

      expect(screen.getByTestId('token-error')).toHaveTextContent(expected!);
    });
  });

  describe('revogar e renomear', () => {
    it('Dado token ativo, quando revoga e confirma, então chama revoke e a linha vira Revogado com o recurso devolvido', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      const { toast } = await setup(stub);
      const show = vi.spyOn(toast, 'show');

      await userEvent.click(screen.getByTestId('token-revoke-a'));
      await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(stub.calls).toContain('revoke:a');
      expect(screen.getByTestId('token-status-a')).toHaveTextContent('Revogado');
      expect(screen.queryByTestId('token-revoke-a')).toBeNull();
      expect(show).toHaveBeenCalledWith(pt.quickEntry.toast.revoked);
    });

    it('Dado revogar e cancelar, então nada é chamado', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      await setup(stub);

      await userEvent.click(screen.getByTestId('token-revoke-a'));
      await userEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      expect(stub.calls).not.toContain('revoke:a');
    });

    it('Dado falha ao revogar, então mostra a mensagem do catálogo', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      const { toast } = await setup(stub);
      const show = vi.spyOn(toast, 'show');
      stub.next = failWith(0, 'NETWORK');

      await userEvent.click(screen.getByTestId('token-revoke-a'));
      await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(show).toHaveBeenCalledWith(pt.errors.network, { tone: 'error' });
      expect(screen.getByTestId('token-status-a')).toHaveTextContent('Ativo');
    });

    it('Dado renomear, quando salva, então chama rename e a linha mostra o nome devolvido', async () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      stub.next = of(aQuickToken({ id: 'a', label: 'iPad da sala' }));
      await setup(stub);

      await userEvent.click(screen.getByTestId('token-rename-a'));
      const field = screen.getByTestId('token-rename-label');
      await userEvent.clear(field);
      await userEvent.type(field, 'iPad da sala');
      await userEvent.click(screen.getByTestId('token-rename-save'));

      expect(stub.calls).toContain('rename:a');
      expect(screen.getByTestId('token-label-a')).toHaveTextContent('iPad da sala');
      expect(screen.queryByTestId('token-rename-form')).toBeNull();
    });
  });

  it('Dado a página pronta, então não tem violações de acessibilidade', async () => {
    const stub = new QuickEntryGatewayStub();
    stub.tokens = [
      aQuickToken({ id: 'a', lastUsedAt: '2026-10-21T15:00:00Z', lastUsedIp: '187.12.34.0' }),
    ];
    const { container } = await setup(stub);

    const violations = await axeViolations(container);

    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
