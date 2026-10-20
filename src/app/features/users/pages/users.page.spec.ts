import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER } from 'rxjs';

import { pt } from '~/app/common/i18n/translations/pt';
import { ToastService } from '~/app/common/services/toast.service';
import { UsersPage } from '~/app/features/users/pages/users.page';
import {
  aManagedUser,
  anInvitation,
  failWithInvitation,
  InvitationsGatewayStub,
  OWNER_MANAGED,
  provideAccessStubs,
  UsersGatewayStub,
} from '~/testing/access-testing';
import { failWith } from '~/testing/accounts-testing';
import { AuthGatewayStub, provideAuthStub } from '~/testing/auth-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

const MEMBER = aManagedUser({ id: 'user-2', email: 'maria@moneylog.app' });

function seeded() {
  const users = new UsersGatewayStub();
  users.users = [OWNER_MANAGED, MEMBER];
  const invitations = new InvitationsGatewayStub();
  invitations.invitations = [
    anInvitation({ id: 'inv-pending', email: 'pendente@moneylog.app' }),
    anInvitation({
      id: 'inv-failed',
      email: 'falhou@moneylog.app',
      deliveryStatus: 'FAILED',
      createdAt: '2026-10-17T12:00:00Z',
    }),
    anInvitation({
      id: 'inv-expired',
      email: 'vencido@moneylog.app',
      status: 'EXPIRED',
      createdAt: '2026-10-10T12:00:00Z',
    }),
    anInvitation({
      id: 'inv-accepted',
      email: 'aceito@moneylog.app',
      status: 'ACCEPTED',
      acceptedAt: '2026-10-19T12:00:00Z',
      createdAt: '2026-10-09T12:00:00Z',
    }),
  ];
  return { users, invitations };
}

async function setup(stubs = seeded()) {
  const auth = new AuthGatewayStub();
  const result = await render(UsersPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideAuthStub(auth),
      provideAccessStubs(stubs.users, stubs.invitations),
    ],
  });
  return { ...result, ...stubs, toast: TestBed.inject(ToastService) };
}

describe('UsersPage', () => {
  it('Dado o dono, então vê pessoas e convites com status, validade e último acesso, e a própria linha sem "desativar"', async () => {
    await setup();

    expect(screen.getByTestId('user-email-' + OWNER_MANAGED.id)).toHaveTextContent(
      'dono@moneylog.app',
    );
    expect(screen.getByTestId('user-role-' + OWNER_MANAGED.id)).toHaveTextContent('Dono');
    expect(screen.getByTestId('user-last-access-' + OWNER_MANAGED.id)).toHaveTextContent(
      'Último acesso em',
    );
    expect(screen.getByTestId('user-last-access-user-2')).toHaveTextContent(
      pt.access.users.people.neverAccessed,
    );
    expect(screen.queryByTestId('user-disable-' + OWNER_MANAGED.id)).toBeNull();
    expect(screen.getByTestId('user-disable-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('invitation-status-inv-pending')).toHaveTextContent('Aguardando');
    expect(screen.getByTestId('invitation-detail-inv-pending')).toHaveTextContent('Válido até');
    expect(screen.getByTestId('invitation-detail-inv-accepted')).toHaveTextContent('Aceito em');
    expect(screen.queryByTestId('invitation-resend-inv-accepted')).toBeNull();
    expect(screen.queryByTestId('users-only-owner')).toBeNull();
  });

  it('Dado só o dono e nenhum convite, então mostra o estado vazio com ação para convidar', async () => {
    const stubs = { users: new UsersGatewayStub(), invitations: new InvitationsGatewayStub() };
    await setup(stubs);

    expect(screen.getByTestId('users-only-owner')).toHaveTextContent(
      pt.access.users.people.onlyYouTitle,
    );
    expect(screen.getByTestId('invitations-empty')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('empty-state-action-invite'));

    expect(screen.getByTestId('invite-email')).toHaveFocus();
  });

  it('Dado carregando, então mostra o estado de carregamento', async () => {
    const stubs = seeded();
    stubs.users.listResult = NEVER;
    stubs.invitations.listResult = NEVER;
    await setup(stubs);

    expect(screen.getByTestId('users-loading')).toBeInTheDocument();
    expect(screen.getByTestId('invitations-loading')).toBeInTheDocument();
  });

  it('Dado que usuários carregam e convites falham, então a parte boa aparece e só a ruim oferece tentar de novo', async () => {
    const stubs = seeded();
    stubs.invitations.listResult = failWith(500, 'INTERNAL_ERROR');
    await setup(stubs);

    expect(screen.getByTestId('users-list')).toBeInTheDocument();
    const error = screen.getByTestId('invitations-error');
    stubs.invitations.listResult = null;
    await userEvent.click(within(error).getByTestId('empty-state-action-retry'));

    expect(screen.getByTestId('invitations-list')).toBeInTheDocument();
    expect(screen.queryByTestId('invitations-error')).toBeNull();
  });

  it('Dado 403 na listagem, então mostra sem permissão em vez dos dados', async () => {
    const stubs = seeded();
    stubs.users.listResult = failWith(403, 'FORBIDDEN');
    await setup(stubs);

    expect(screen.getByText(pt.access.users.forbidden.title)).toBeInTheDocument();
    expect(screen.queryByTestId('invite-form')).toBeNull();
  });

  describe('convidar', () => {
    it('Dado e-mail válido, quando envio, então o convite devolvido entra na lista, o campo limpa e confirma', async () => {
      const { invitations, toast } = await setup();

      await userEvent.type(screen.getByTestId('invite-email'), 'nova@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(invitations.calls).toContain('create:nova@moneylog.app');
      expect(screen.getByTestId('invitation-email-inv-new')).toHaveTextContent('nova@moneylog.app');
      expect((screen.getByTestId('invite-email') as HTMLInputElement).value).toBe('');
      expect(toast.toasts().at(-1)?.message).toBe('Convite enviado para nova@moneylog.app.');
    });

    it('Dado envio em andamento, então o botão fica desabilitado (sem duplo envio)', async () => {
      const stubs = seeded();
      stubs.invitations.next = NEVER;
      await setup(stubs);

      await userEvent.type(screen.getByTestId('invite-email'), 'nova@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(screen.getByTestId('invite-submit')).toBeDisabled();
      await userEvent.click(screen.getByTestId('invite-submit'));
      expect(stubs.invitations.calls.filter((c) => c.startsWith('create'))).toHaveLength(1);
    });

    it('Dado e-mail inválido, então não envia', async () => {
      const { invitations } = await setup();

      await userEvent.type(screen.getByTestId('invite-email'), 'sem-arroba');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(invitations.calls.filter((c) => c.startsWith('create'))).toEqual([]);
    });

    it('Dado 409 EMAIL_ALREADY_REGISTERED, então mostra a mensagem do contrato, sem texto técnico, e mantém o e-mail', async () => {
      const stubs = seeded();
      stubs.invitations.next = failWith(409, 'EMAIL_ALREADY_REGISTERED');
      await setup(stubs);

      await userEvent.type(screen.getByTestId('invite-email'), 'maria@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(screen.getByTestId('invite-error')).toHaveTextContent(
        pt.errors.codes['EMAIL_ALREADY_REGISTERED']!,
      );
      expect((screen.getByTestId('invite-email') as HTMLInputElement).value).toBe(
        'maria@moneylog.app',
      );
    });

    it('Dado 409 USER_LIMIT_REACHED, então mostra a mensagem do limite', async () => {
      const stubs = seeded();
      stubs.invitations.next = failWith(409, 'USER_LIMIT_REACHED');
      await setup(stubs);

      await userEvent.type(screen.getByTestId('invite-email'), 'x@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(screen.getByTestId('invite-error')).toHaveTextContent(
        pt.errors.codes['USER_LIMIT_REACHED']!,
      );
    });

    it('Dado 409 INVITATION_PENDING, então oferece reenviar o convite existente', async () => {
      const stubs = seeded();
      stubs.invitations.next = failWithInvitation(409, 'INVITATION_PENDING', 'inv-pending');
      await setup(stubs);

      await userEvent.type(screen.getByTestId('invite-email'), 'pendente@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));
      stubs.invitations.next = null;
      await userEvent.click(screen.getByTestId('invite-resend-existing'));

      expect(stubs.invitations.calls).toContain('resend:inv-pending');
    });

    it('Dado 502 EMAIL_DELIVERY_FAILED, então recarrega a lista do backend (sem duplicar) e mostra o convite com a ação de reenviar', async () => {
      const stubs = seeded();
      await setup(stubs);
      stubs.invitations.next = failWithInvitation(502, 'EMAIL_DELIVERY_FAILED', 'inv-failed');

      await userEvent.type(screen.getByTestId('invite-email'), 'falhou@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(screen.getByTestId('invite-error')).toHaveTextContent(
        pt.errors.codes['EMAIL_DELIVERY_FAILED']!,
      );
      expect(screen.getAllByTestId('invitation-email-inv-failed')).toHaveLength(1);
      expect(screen.getByTestId('invitation-delivery-failed-inv-failed')).toHaveTextContent(
        pt.access.users.invitations.deliveryFailed,
      );
      expect(screen.getByTestId('invitation-resend-inv-failed')).toBeEnabled();
      expect((screen.getByTestId('invite-email') as HTMLInputElement).value).toBe('');
    });

    it('Dado 404 INVITATIONS_DISABLED, então troca o formulário por um aviso neutro de indisponível', async () => {
      const stubs = seeded();
      stubs.invitations.next = failWith(404, 'INVITATIONS_DISABLED');
      await setup(stubs);

      await userEvent.type(screen.getByTestId('invite-email'), 'x@moneylog.app');
      await userEvent.click(screen.getByTestId('invite-submit'));

      expect(screen.getByTestId('invite-unavailable')).toHaveTextContent(
        pt.access.users.invite.unavailableTitle,
      );
      expect(screen.queryByTestId('invite-form')).toBeNull();
      expect(screen.getByTestId('users-list')).toBeInTheDocument();
    });
  });

  describe('ações nos itens', () => {
    it('Dado reenviar num convite expirado, então o item mostra o estado devolvido pela API', async () => {
      const { invitations } = await setup();

      await userEvent.click(screen.getByTestId('invitation-resend-inv-expired'));

      expect(invitations.calls).toContain('resend:inv-expired');
      expect(screen.getByTestId('invitation-status-inv-expired')).toHaveTextContent('Aguardando');
    });

    it('Dado reenviar em andamento, então os controles do item ficam desabilitados', async () => {
      const stubs = seeded();
      stubs.invitations.next = NEVER;
      await setup(stubs);

      await userEvent.click(screen.getByTestId('invitation-resend-inv-expired'));

      expect(screen.getByTestId('invitation-resend-inv-expired')).toBeDisabled();
      expect(screen.getByTestId('invitation-revoke-inv-expired')).toBeDisabled();
      expect(screen.getByTestId('invitation-resend-inv-pending')).toBeEnabled();
    });

    it('Dado 409 EMAIL_ALREADY_REGISTERED ao reenviar um expirado, então a mensagem é específica', async () => {
      const stubs = seeded();
      const { toast } = await setup(stubs);
      stubs.invitations.next = failWith(409, 'EMAIL_ALREADY_REGISTERED');

      await userEvent.click(screen.getByTestId('invitation-resend-inv-expired'));

      expect(toast.toasts().at(-1)).toEqual(
        expect.objectContaining({
          message: pt.errors.codes['EMAIL_ALREADY_REGISTERED'],
          tone: 'error',
        }),
      );
    });

    it('Dado revogar, quando confirmo no diálogo, então o item mostra REVOKED e perde as ações', async () => {
      const { invitations } = await setup();

      await userEvent.click(screen.getByTestId('invitation-revoke-inv-pending'));
      expect(invitations.calls).not.toContain('revoke:inv-pending');
      await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(invitations.calls).toContain('revoke:inv-pending');
      expect(screen.getByTestId('invitation-status-inv-pending')).toHaveTextContent('Revogado');
      expect(screen.queryByTestId('invitation-revoke-inv-pending')).toBeNull();
    });

    it('Dado desativar, quando cancelo o diálogo, então nada é chamado', async () => {
      const { users } = await setup();

      await userEvent.click(screen.getByTestId('user-disable-user-2'));
      await userEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      expect(users.calls).not.toContain('disable:user-2');
    });

    it('Dado desativar confirmado, então o item mostra Desativado com a resposta e oferece reativar', async () => {
      const { users } = await setup();

      await userEvent.click(screen.getByTestId('user-disable-user-2'));
      await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(users.calls).toContain('disable:user-2');
      expect(screen.getByTestId('user-status-user-2')).toHaveTextContent('Desativado');

      await userEvent.click(screen.getByTestId('user-enable-user-2'));

      expect(users.calls).toContain('enable:user-2');
      expect(screen.getByTestId('user-status-user-2')).toHaveTextContent('Ativo');
    });
  });

  it('Dado a tela com dados, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);

    expect(describeViolations(violations)).toBe('');
  });
});
