import { inject, provideAppInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, throwError } from 'rxjs';

import { pt } from '~/app/common/i18n/translations/pt';
import { AcceptInvitationPage } from '~/app/features/invitation/pages/accept-invitation.page';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import { AuthGatewayStub, MEMBER_USER, provideAuthStub } from '~/testing/auth-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

const STRONG = 'uma senha bem longa';

function openLink(fragment: string | null): void {
  const hash = fragment === null ? '' : `#${fragment}`;
  history.replaceState(null, '', `/convite${hash}`);
}

async function setup(fragment: string | null = 'tok-secreto', gateway = new AuthGatewayStub()) {
  openLink(fragment);
  const result = await render(AcceptInvitationPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([{ path: '', children: [] }]),
      provideAuthStub(gateway),
    ],
  });
  return { ...result, gateway, router: TestBed.inject(Router) };
}

describe('AcceptInvitationPage', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('Dado /convite#token, então lê o token, tira o fragmento da URL na hora e chama o preview com ele', async () => {
    const { gateway } = await setup('tok-secreto');

    expect(location.hash).toBe('');
    expect(location.href).not.toContain('tok-secreto');
    expect(gateway.previews).toEqual(['tok-secreto']);
    expect(screen.getByTestId('invitation-email')).toHaveTextContent(MEMBER_USER.email);
    expect(screen.getByTestId('invitation-valid-until')).toHaveTextContent('Válido até');
  });

  it('Dado o formulário, então o token nunca aparece no DOM', async () => {
    const { container } = await setup('tok-secreto');

    expect(container.innerHTML).not.toContain('tok-secreto');
  });

  it('Dado /convite sem fragmento, então mostra o estado único de convite inválido sem chamar a API', async () => {
    const { gateway } = await setup(null);

    expect(screen.getByTestId('invitation-invalid')).toHaveTextContent(
      pt.access.invitation.invalid.title,
    );
    expect(screen.getByTestId('invitation-invalid')).toHaveTextContent('Abra o link do e-mail');
    expect(gateway.previews).toEqual([]);
  });

  it('Dado convite inválido, então o foco vai para o título e a orientação cobre reabrir o link e pedir outro ao dono', async () => {
    await setup(null);

    expect(screen.getByTestId('page-title')).toHaveFocus();
    expect(screen.getByTestId('invitation-invalid')).toHaveTextContent(
      'peça outro convite ao dono',
    );
  });

  it('Dado senha digitada, então cada regra anuncia atendida ou pendente para leitor de tela', async () => {
    await setup();

    expect(screen.getByTestId('invitation-rule-length')).toHaveTextContent('Pendente');
    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);

    expect(screen.getByTestId('invitation-rule-length')).toHaveTextContent('Atendida');
  });

  it('Dado 404 INVALID_INVITATION no preview, então mostra convite inválido sem dizer o motivo', async () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('invalid_invitation'));
    await setup('tok', gateway);

    expect(screen.getByTestId('invitation-invalid')).toBeInTheDocument();
    expect(screen.queryByTestId('invitation-form')).toBeNull();
  });

  it('Dado falha de rede no preview, então não diz "inválido": oferece tentar de novo e o retry recupera', async () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('network'));
    await setup('tok', gateway);

    expect(screen.getByTestId('invitation-unavailable')).toHaveTextContent(
      pt.access.invitation.unavailable.title,
    );
    expect(screen.queryByTestId('invitation-invalid')).toBeNull();

    gateway.preview$ = new AuthGatewayStub().preview$;
    await userEvent.click(screen.getByTestId('invitation-retry'));

    expect(gateway.previews).toEqual(['tok', 'tok']);
    expect(screen.getByTestId('invitation-form')).toBeInTheDocument();
  });

  it('Dado 429 no preview, então mostra o tempo de espera do Retry-After', async () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('rate_limited', 120));
    await setup('tok', gateway);

    expect(screen.getByTestId('invitation-unavailable')).toHaveTextContent('2 min');
  });

  it('Dado o carregamento do preview, então mostra o estado de verificação', async () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = NEVER;
    await setup('tok', gateway);

    expect(screen.getByTestId('invitation-checking')).toHaveTextContent(
      pt.access.invitation.checking,
    );
  });

  it('Dado senha curta, então mostra as regras e só marca como atendidas as cumpridas', async () => {
    await setup();

    await userEvent.type(screen.getByTestId('invitation-password'), 'curta');

    expect(screen.getByTestId('invitation-rule-length')).not.toHaveClass('invite__rule--met');
    expect(screen.getByTestId('invitation-rule-bytes')).toHaveClass('invite__rule--met');

    await userEvent.type(screen.getByTestId('invitation-password'), ' senha longa');

    expect(screen.getByTestId('invitation-rule-length')).toHaveClass('invite__rule--met');
  });

  it('Dado senhas diferentes, então não envia', async () => {
    const { gateway } = await setup();

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), 'outra coisa toda');
    await userEvent.click(screen.getByTestId('invitation-submit'));

    expect(gateway.accepts).toEqual([]);
  });

  it('Dado WEAK_PASSWORD do servidor, então mostra o aviso, mantém o formulário e o texto digitado', async () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = throwError(() => new AuthFailure('weak_password'));
    await setup('tok', gateway);

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), STRONG);
    await userEvent.click(screen.getByTestId('invitation-submit'));

    expect(screen.getByTestId('invitation-error')).toHaveTextContent(
      pt.access.invitation.errors.weakPassword,
    );
    expect((screen.getByTestId('invitation-password') as HTMLInputElement).value).toBe(STRONG);
    expect(screen.getByTestId('invitation-submit')).toBeEnabled();
  });

  it('Dado 429 no aceite, então mostra o tempo de espera', async () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = throwError(() => new AuthFailure('rate_limited', 300));
    await setup('tok', gateway);

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), STRONG);
    await userEvent.click(screen.getByTestId('invitation-submit'));

    expect(screen.getByTestId('invitation-error')).toHaveTextContent('5 min');
  });

  it('Dado envio em andamento, então o botão fica desabilitado', async () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = NEVER;
    await setup('tok', gateway);

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), STRONG);
    await userEvent.click(screen.getByTestId('invitation-submit'));

    expect(screen.getByTestId('invitation-submit')).toBeDisabled();
    expect(gateway.accepts).toHaveLength(1);
  });

  it('Dado senha forte, então envia o token e a senha no corpo, abre a sessão do convidado e vai para o início', async () => {
    const { gateway, router } = await setup('tok-secreto');

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), STRONG);
    await userEvent.click(screen.getByTestId('invitation-submit'));
    await router.navigateByUrl('/');

    expect(gateway.accepts).toEqual([{ token: 'tok-secreto', password: STRONG }]);
    expect(TestBed.inject(SessionFacade).role()).toBe('MEMBER');
    expect(router.url).toBe('/');
  });

  it('Dado 404 no aceite, então vira convite inválido', async () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = throwError(() => new AuthFailure('invalid_invitation'));
    await setup('tok', gateway);

    await userEvent.type(screen.getByTestId('invitation-password'), STRONG);
    await userEvent.type(screen.getByTestId('invitation-confirm-password'), STRONG);
    await userEvent.click(screen.getByTestId('invitation-submit'));

    expect(screen.getByTestId('invitation-invalid')).toBeInTheDocument();
  });

  describe('com sessão aberta', () => {
    async function withSession() {
      const gateway = new AuthGatewayStub();
      openLink('tok-secreto');
      const result = await render(AcceptInvitationPage, {
        providers: [
          provideI18nTesting('pt'),
          provideRouter([{ path: '', children: [] }]),
          provideAuthStub(gateway),
          provideAppInitializer(() => inject(SessionFacade).restore()),
        ],
      });
      return { ...result, gateway, router: TestBed.inject(Router) };
    }

    it('Dado usuário logado, então pergunta antes de mexer na sessão, sem chamar o preview e sem fragmento na URL', async () => {
      const { gateway } = await withSession();

      expect(screen.getByTestId('invitation-existing-session')).toHaveTextContent(
        pt.access.invitation.existingSession.title,
      );
      expect(gateway.previews).toEqual([]);
      expect(gateway.logouts).toBe(0);
      expect(TestBed.inject(SessionFacade).authenticated()).toBe(true);
      expect(location.hash).toBe('');
    });

    it('Dado "sair e usar o convite", então encerra a sessão e segue o aceite com o mesmo token', async () => {
      const { gateway } = await withSession();

      await userEvent.click(screen.getByTestId('invitation-sign-out-and-use'));

      expect(gateway.logouts).toBe(1);
      expect(gateway.previews).toEqual(['tok-secreto']);
      expect(screen.getByTestId('invitation-form')).toBeInTheDocument();
    });

    it('Dado "continuar com a conta atual", então descarta o token, mantém a sessão e vai para o início', async () => {
      const { gateway, router } = await withSession();

      await userEvent.click(screen.getByTestId('invitation-keep-session'));
      await router.navigateByUrl('/');

      expect(gateway.previews).toEqual([]);
      expect(gateway.logouts).toBe(0);
      expect(TestBed.inject(SessionFacade).authenticated()).toBe(true);
    });
  });

  it('Dado a página, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    expect(describeViolations(await axeViolations(container))).toBe('');
  });
});
