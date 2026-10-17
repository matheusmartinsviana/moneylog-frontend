import { expect, seedMockResponses, seedPreferences, test, waitForApp } from './support';
import { homeResponses } from './support/home-fixtures';

test.use({ reducedMotion: 'no-preference' });

test('o Início entra em cascata e termina visível e clicável', async ({ page }) => {
  await seedPreferences(page, { language: 'pt' });
  await seedMockResponses(page, homeResponses());
  await page.goto('/');
  await waitForApp(page);

  const home = page.locator('[data-cy="home-dashboard"]');
  await expect(home).toBeVisible();
  for (const child of await home.locator(':scope > *').all()) {
    await child.scrollIntoViewIfNeeded();
    await expect(child).not.toHaveClass(/m-pending/, { timeout: 3000 });
    await expect(child).toHaveCSS('opacity', '1', { timeout: 3000 });
  }
  await expect(page.locator('.m-enter')).toHaveCount(0, { timeout: 4000 });
  await page.locator('[data-cy="home-recent-link"]').first().click();
  await expect(page).toHaveURL(/\/transactions\//);
});
