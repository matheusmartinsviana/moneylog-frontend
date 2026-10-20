import { expect, seedPreferences, test, waitForApp } from '../support';

import {
  createStub,
  installStub,
  invitation,
  managedUser,
  MEMBER,
  OWNER,
  type Stub,
} from './api-stub';

const PENDING_ID = '00000000-0000-4000-8000-0000000000a1';
const FAILED_ID = '00000000-0000-4000-8000-0000000000a2';

async function openUsers(page: import('@playwright/test').Page, stub: Stub): Promise<void> {
  await seedPreferences(page, { language: 'pt' });
  await installStub(page, stub);
  await page.goto('/users');
  await waitForApp(page);
}

async function invite(page: import('@playwright/test').Page, email: string): Promise<void> {
  await page.locator('[data-cy="invite-email"]').fill(email);
  await page.locator('[data-cy="invite-submit"]').click();
}

test.describe('pessoas com acesso (dono)', () => {
  test('Dado o dono sozinho, Quando abre /users, Então vê o estado vazio de convites e a nota de só ele', async ({
    page,
  }) => {
    await openUsers(page, createStub());

    await expect(page.locator(`[data-cy="user-email-${OWNER.id}"]`)).toHaveText(OWNER.email);
    await expect(page.locator(`[data-cy="user-self-${OWNER.id}"]`)).toBeVisible();
    await expect(page.locator('[data-cy="users-only-owner"]')).toBeVisible();
    await expect(page.locator('[data-cy="invitations-empty"]')).toBeVisible();
    await expect(page.locator(`[data-cy="user-disable-${OWNER.id}"]`)).toHaveCount(0);
  });

  test('Dado a lista com falha, Quando clica em tentar de novo, Então carrega a lista', async ({
    page,
  }) => {
    const stub = createStub();
    stub.fail('GET /v1/users', { status: 500 });
    await openUsers(page, stub);

    await expect(page.locator('[data-cy="users-error"]')).toBeVisible();
    stub.failures.clear();
    await page.locator('[data-cy="users-error"] button').click();
    await expect(page.locator('[data-cy="users-list"]')).toBeVisible();
  });

  test('Dado um e-mail novo, Quando o dono convida, Então o convite aparece aguardando e o campo é limpo', async ({
    page,
  }) => {
    const stub = createStub();
    await openUsers(page, stub);

    await invite(page, 'novo@moneylog.app');

    await expect(page.locator('[data-cy="invitations-list"]')).toContainText('novo@moneylog.app');
    await expect(page.locator('[data-cy="toast-region"]')).toContainText(
      'Convite enviado para novo@moneylog.app.',
    );
    await expect(page.locator('[data-cy="invite-email"]')).toHaveValue('');
    expect(stub.callsTo('POST', '/v1/invitations')[0]?.body).toEqual({
      email: 'novo@moneylog.app',
    });
  });

  test('Dado um e-mail inválido, Quando envia, Então nenhuma chamada é feita', async ({ page }) => {
    const stub = createStub();
    await openUsers(page, stub);

    await invite(page, 'sem-arroba');

    await expect(page.locator('[data-cy="toast-region"]')).not.toContainText('Convite enviado');
    expect(stub.callsTo('POST', '/v1/invitations')).toHaveLength(0);
  });

  test('Dado EMAIL_ALREADY_REGISTERED, Quando convida, Então mostra a mensagem e recarrega as pessoas', async ({
    page,
  }) => {
    const stub = createStub();
    await openUsers(page, stub);
    stub.fail('POST /v1/invitations', { status: 409, code: 'EMAIL_ALREADY_REGISTERED' });
    stub.users.push(managedUser(MEMBER));

    await invite(page, MEMBER.email);

    await expect(page.locator('[data-cy="invite-error"]')).toContainText(
      'Esse e-mail já tem acesso ao Monelog',
    );
    await expect(page.locator(`[data-cy="user-email-${MEMBER.id}"]`)).toBeVisible();
  });

  test('Dado INVITATION_PENDING, Quando convida e reenvia o existente, Então reenvia pelo id informado', async ({
    page,
  }) => {
    const stub = createStub({ invitations: [invitation(PENDING_ID, 'novo@moneylog.app')] });
    await openUsers(page, stub);
    stub.fail('POST /v1/invitations', {
      status: 409,
      code: 'INVITATION_PENDING',
      extra: { invitationId: PENDING_ID },
    });

    await invite(page, 'novo@moneylog.app');
    await expect(page.locator('[data-cy="invite-error"]')).toContainText(
      'Já existe um convite aguardando resposta',
    );
    await page.locator('[data-cy="invite-resend-existing"]').click();

    await expect(page.locator('[data-cy="toast-region"]')).toContainText(
      'Convite reenviado para novo@moneylog.app.',
    );
    expect(stub.callsTo('POST', `/v1/invitations/${PENDING_ID}/resend`)).toHaveLength(1);
  });

  test('Dado USER_LIMIT_REACHED, Quando convida, Então explica o limite', async ({ page }) => {
    const stub = createStub();
    await openUsers(page, stub);
    stub.fail('POST /v1/invitations', { status: 409, code: 'USER_LIMIT_REACHED' });

    await invite(page, 'outro@moneylog.app');

    await expect(page.locator('[data-cy="invite-error"]')).toContainText(
      'O limite de pessoas com acesso foi atingido',
    );
  });

  test('Dado EMAIL_DELIVERY_FAILED, Quando convida, Então avisa, limpa o campo e marca o convite com falha de envio', async ({
    page,
  }) => {
    const stub = createStub();
    await openUsers(page, stub);
    stub.fail('POST /v1/invitations', { status: 502, code: 'EMAIL_DELIVERY_FAILED' });
    stub.invitations.push(
      invitation(FAILED_ID, 'falhou@moneylog.app', { deliveryStatus: 'FAILED' }),
    );

    await invite(page, 'falhou@moneylog.app');

    await expect(page.locator('[data-cy="invite-error"]')).toContainText(
      'não conseguimos enviar o e-mail agora',
    );
    await expect(page.locator('[data-cy="invite-email"]')).toHaveValue('');
    await expect(page.locator(`[data-cy="invitation-delivery-failed-${FAILED_ID}"]`)).toBeVisible();
  });

  test('Dado INVITATIONS_DISABLED, Quando convida, Então o formulário vira aviso de indisponível', async ({
    page,
  }) => {
    const stub = createStub();
    await openUsers(page, stub);
    stub.fail('POST /v1/invitations', { status: 503, code: 'INVITATIONS_DISABLED' });

    await invite(page, 'novo@moneylog.app');

    await expect(page.locator('[data-cy="invite-unavailable"]')).toBeVisible();
    await expect(page.locator('[data-cy="invite-form"]')).toHaveCount(0);
  });

  test('Dado um convite aguardando, Quando reenvia, Então atualiza a linha com a resposta do servidor', async ({
    page,
  }) => {
    const stub = createStub({
      invitations: [invitation(FAILED_ID, 'falhou@moneylog.app', { deliveryStatus: 'FAILED' })],
    });
    await openUsers(page, stub);
    await expect(page.locator(`[data-cy="invitation-delivery-failed-${FAILED_ID}"]`)).toBeVisible();

    await page.locator(`[data-cy="invitation-resend-${FAILED_ID}"]`).click();

    await expect(page.locator('[data-cy="toast-region"]')).toContainText(
      'Convite reenviado para falhou@moneylog.app.',
    );
    await expect(page.locator(`[data-cy="invitation-delivery-failed-${FAILED_ID}"]`)).toHaveCount(
      0,
    );
  });

  test('Dado um convite aguardando, Quando revoga, Então só revoga depois de confirmar', async ({
    page,
  }) => {
    const stub = createStub({ invitations: [invitation(PENDING_ID, 'novo@moneylog.app')] });
    await openUsers(page, stub);

    await page.locator(`[data-cy="invitation-revoke-${PENDING_ID}"]`).click();
    await page.locator('[data-cy="confirm-dialog-cancel"]').click();
    expect(stub.callsTo('DELETE', `/v1/invitations/${PENDING_ID}`)).toHaveLength(0);

    await page.locator(`[data-cy="invitation-revoke-${PENDING_ID}"]`).click();
    await page.locator('[data-cy="confirm-dialog-confirm"]').click();

    await expect(page.locator(`[data-cy="invitation-status-${PENDING_ID}"]`)).toHaveText(
      'Revogado',
    );
    await expect(page.locator(`[data-cy="invitation-revoke-${PENDING_ID}"]`)).toHaveCount(0);
    expect(stub.callsTo('DELETE', `/v1/invitations/${PENDING_ID}`)).toHaveLength(1);
  });

  test('Dado um convidado ativo, Quando o dono desativa e reativa, Então o status segue a resposta do servidor', async ({
    page,
  }) => {
    const stub = createStub({ users: [managedUser(OWNER), managedUser(MEMBER)] });
    await openUsers(page, stub);
    await expect(page.locator(`[data-cy="user-status-${MEMBER.id}"]`)).toHaveText('Ativo');

    await page.locator(`[data-cy="user-disable-${MEMBER.id}"]`).click();
    await page.locator('[data-cy="confirm-dialog-cancel"]').click();
    expect(stub.callsTo('POST', `/v1/users/${MEMBER.id}/disable`)).toHaveLength(0);

    await page.locator(`[data-cy="user-disable-${MEMBER.id}"]`).click();
    await page.locator('[data-cy="confirm-dialog-confirm"]').click();
    await expect(page.locator(`[data-cy="user-status-${MEMBER.id}"]`)).toHaveText('Desativado');
    await expect(page.locator('[data-cy="toast-region"]')).toContainText(
      `Acesso de ${MEMBER.email} desativado.`,
    );

    await page.locator(`[data-cy="user-enable-${MEMBER.id}"]`).click();
    await expect(page.locator(`[data-cy="user-status-${MEMBER.id}"]`)).toHaveText('Ativo');
    expect(stub.callsTo('POST', `/v1/users/${MEMBER.id}/enable`)).toHaveLength(1);
  });

  test('Dado 403 na listagem, Quando abre /users, Então mostra a área sem acesso sem confiar na claim', async ({
    page,
  }) => {
    const stub = createStub();
    stub.fail('GET /v1/users', { status: 403, code: 'FORBIDDEN' });
    await openUsers(page, stub);

    await expect(page.getByText('Você não tem acesso a esta área')).toBeVisible();
    await expect(page.locator('[data-cy="invite-form"]')).toHaveCount(0);
  });
});
