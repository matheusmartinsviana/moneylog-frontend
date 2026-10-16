import { expect, seedPreferences, test, waitForApp } from './support';

const DEMO_CARD_ID = '00000003-0000-4000-8000-000000000001';
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Pix no crédito (demo)', () => {
  test('Dado o cartão de exemplo, quando abro Pix no crédito, então vejo o formulário e a validação do valor', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await page.goto(`/cards/${DEMO_CARD_ID}/cash-out`);

    const form = page.locator('[data-cy="card-cash-out-form"]');
    await expect(form).toBeVisible();
    await expect(page.locator('[data-cy="card-cash-out-principal"]')).toBeVisible();
    await expect(page.locator('[data-cy="card-cash-out-save"]')).toBeEnabled();

    await page.locator('[data-cy="card-cash-out-save"]').click();
    await expect(page.locator('[data-cy="card-cash-out-principal"]')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('Dado o formulário aberto, quando cancelo, então volto para o cartão', async ({ page }) => {
    await seedPreferences(page, { language: 'pt' });
    await page.goto(`/cards/${DEMO_CARD_ID}/cash-out`);
    await expect(page.locator('[data-cy="card-cash-out-form"]')).toBeVisible();

    await page.locator('[data-cy="card-cash-out-cancel"]').click();

    await expect(page).toHaveURL(new RegExp(`/cards/${DEMO_CARD_ID}$`));
  });
});

test.describe('Perfil em Ajustes (demo)', () => {
  test('Dado Ajustes, quando salvo o apelido, então vejo o aviso e o botão volta a ficar desabilitado', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await page.goto('/settings');
    await expect(page.locator('[data-cy="profile-section"]')).toBeVisible();
    const save = page.locator('[data-cy="profile-nickname-save"]');
    await expect(save).toBeDisabled();

    await page.locator('[data-cy="profile-nickname"]').fill('Mateus');
    await expect(save).toBeEnabled();
    await save.click();

    await expect(page.locator('[data-cy="profile-notice"]')).toHaveText('Perfil salvo.');
    await expect(save).toBeDisabled();
  });

  test('Dado Ajustes, quando envio uma foto e depois removo, então os avisos e o botão de remover acompanham', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await page.goto('/settings');
    await expect(page.locator('[data-cy="profile-section"]')).toBeVisible();
    await expect(page.locator('[data-cy="profile-photo-remove"]')).toHaveCount(0);

    await page
      .locator('[data-cy="profile-photo-change-native"]')
      .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: TINY_PNG });

    await expect(page.locator('[data-cy="profile-notice"]')).toHaveText('Foto atualizada.');
    const remove = page.locator('[data-cy="profile-photo-remove"]');
    await expect(remove).toBeVisible();

    await remove.click();

    await expect(page.locator('[data-cy="profile-notice"]')).toHaveText('Foto removida.');
    await expect(remove).toHaveCount(0);
  });
});

test.describe('Modo foco do pomodoro (demo)', () => {
  test('Dado o Início, quando abro o modo foco e inicio, então o Esc fecha e o cronômetro segue no cartão', async ({
    page,
  }) => {
    await seedPreferences(page, { language: 'pt' });
    await page.goto('/');
    await waitForApp(page);
    const cardTimer = page.locator('[data-cy="home-pomodoro-timer"]');
    await expect(cardTimer).toBeVisible();

    await page.locator('[data-cy="home-pomodoro-focus-open"]').click();
    const focusTimer = page.locator('[data-cy="pomodoro-focus-timer"]');
    await expect(focusTimer).toBeVisible();

    const before = await focusTimer.getAttribute('aria-label');
    await page.locator('[data-cy="pomodoro-focus-toggle"]').click();
    await expect
      .poll(async () => focusTimer.getAttribute('aria-label'), { timeout: 5_000 })
      .not.toBe(before);

    await page.keyboard.press('Escape');
    await expect(focusTimer).toHaveCount(0);
    await expect(page.locator('[data-cy="home-pomodoro-focus-open"]')).toBeFocused();

    const atClose = await cardTimer.getAttribute('aria-label');
    await expect
      .poll(async () => cardTimer.getAttribute('aria-label'), { timeout: 5_000 })
      .not.toBe(atClose);
  });
});
