import { expect, seedPreferences, test, waitForApp } from '../support';

import { createStub, installStub, MEMBER, OWNER } from './api-stub';

test.describe('papel na interface', () => {
  test('Dado o dono, Quando abre os ajustes, Então vê o link de pessoas com acesso', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await installStub(page, createStub({ session: OWNER }));
    await page.goto('/settings');
    await waitForApp(page);

    await expect(page.locator('[data-cy="settings-users-link"]')).toBeVisible();
  });

  test('Dado um convidado, Quando abre os ajustes, Então não vê o link de pessoas', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await installStub(page, createStub({ session: MEMBER }));
    await page.goto('/settings');
    await waitForApp(page);

    await expect(page.locator('[data-cy="settings-users-link"]')).toHaveCount(0);
  });

  for (const path of ['/users', '/ai', '/mcp']) {
    test(`Dado um convidado, Quando abre ${path} pela URL, Então é redirecionado ao início sem chamar a API da área`, async ({
      page,
    }) => {
      const stub = createStub({ session: MEMBER });
      await seedPreferences(page, { language: 'pt' });
      await installStub(page, stub);

      await page.goto(path);

      await expect(page).toHaveURL(/\/$/);
      expect(stub.callsTo('GET', '/v1/users')).toHaveLength(0);
      expect(stub.callsTo('GET', '/v1/invitations')).toHaveLength(0);
    });
  }
});
