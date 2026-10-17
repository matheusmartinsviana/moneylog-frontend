import { expect, test, waitForApp } from './support';

async function tabUntil(page: import('@playwright/test').Page, cy: string): Promise<boolean> {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const reached = await page.evaluate(
      (expected) => document.activeElement?.getAttribute('data-cy') === expected,
      cy,
    );
    if (reached) return true;
  }
  return false;
}

test.describe('teclado nos pontos de acessibilidade do Sonar (demo)', () => {
  test('lista estreita de lançamentos: Tab chega ao botão do item, Enter e Espaço abrem, sem erro de console', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/transactions');
    await waitForApp(page);
    await page.locator('[data-cy="view-entries"]').click();
    const item = page.locator('[data-cy="entry-item-0"]');
    await expect(item).toBeVisible();
    expect(await item.evaluate((element) => element.tagName)).toBe('BUTTON');
    await expect(page.locator('li.item[tabindex]')).toHaveCount(0);
    expect(await tabUntil(page, 'entry-item-0')).toBe(true);
    const ring = await item.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(ring).not.toBe('none');

    const before = page.url();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.url()).not.toBe(before);
    const opened = page.url();
    await page.goBack();
    await waitForApp(page);
    await page.locator('[data-cy="view-entries"]').click();
    await page.locator('[data-cy="entry-item-0"]').focus();
    await page.keyboard.press('Space');
    await expect.poll(() => page.url()).toBe(opened);
    expect(errors).toEqual([]);
  });

  test('select: setas movem o descendente ativo para um role option, Enter escolhe e Escape fecha', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/transactions');
    await waitForApp(page);
    const toggle = page.locator('[data-cy="filters-toggle"]');
    if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-expanded')) !== 'true') {
      await toggle.click();
    }
    const select = page.locator('[data-cy="filter-account"]');
    await select.focus();
    await page.keyboard.press('Enter');
    await expect(select).toHaveAttribute('aria-expanded', 'true');
    const listbox = page.locator('[data-cy="filter-account-listbox"]');
    expect(await listbox.evaluate((element) => element.tagName)).toBe('DIV');
    const first = await select.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    const second = await select.getAttribute('aria-activedescendant');
    expect(second).not.toBe(first);
    expect(await page.locator(`[id="${second}"]`).getAttribute('role')).toBe('option');
    await page.keyboard.press('Enter');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(select).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await expect(select).toBeFocused();
  });

  test('galeria: o visualizador não é parada de Tab e setas, Home e End funcionam a partir do botão próximo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/goals');
    await waitForApp(page);
    const total = await page.locator('[data-cy^="goal-open-"]').count();
    let found = false;
    for (let index = 0; index < total && !found; index++) {
      await page.goto('/goals');
      await waitForApp(page);
      await page.locator('[data-cy^="goal-open-"]').nth(index).click();
      await page.waitForTimeout(800);
      found = (await page.locator('[data-cy="goal-gallery-next"]').count()) > 0;
    }
    expect(found).toBe(true);
    expect(
      await page.locator('[data-cy="goal-gallery-viewer"]').getAttribute('tabindex'),
    ).toBeNull();
    const announce = page.locator('[data-cy="goal-gallery-announce"]');
    await expect(announce).toContainText('Foto 1 de 3');
    await page.locator('[data-cy="goal-gallery-next"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(announce).toContainText('Foto 2 de 3');
    await page.keyboard.press('End');
    await expect(announce).toContainText('Foto 3 de 3');
    await page.keyboard.press('Home');
    await expect(announce).toContainText('Foto 1 de 3');
    await page.keyboard.press('ArrowLeft');
    await expect(announce).toContainText('Foto 3 de 3');
  });

  test('a tabela do extrato continua focável por teclado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/statement');
    await waitForApp(page);
    await expect(page.locator('app-statement-table [tabindex="0"]')).toHaveCount(1);
  });
});
