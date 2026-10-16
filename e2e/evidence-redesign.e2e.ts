import { resolve } from 'node:path';

import {
  expectNoHorizontalScroll,
  seedMockResponses,
  seedPreferences,
  test,
  VIEWPORTS,
  ViewportName,
  waitForApp,
} from './support';
import { homeResponses } from './support/home-fixtures';

const OUT_DIR = resolve(__dirname, '..', '..', 'docs', 'qa', 'evidencias', 'redesign');
const SIZE: Record<ViewportName, number> = { mobile: 375, tablet: 768, desktop: 1280 };

test.skip(!process.env['E2E_EVIDENCE'], 'capturas só com E2E_EVIDENCE=1');
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mock', 'o UI Kit só existe no projeto mock');
});

for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
  for (const scheme of ['light', 'dark'] as const) {
    const tema = scheme === 'light' ? 'claro' : 'escuro';
    test.describe(`${SIZE[viewport]} ${tema}`, () => {
      test.use({ viewport: VIEWPORTS[viewport], colorScheme: scheme });

      test(`casca ${viewport} ${scheme}`, async ({ page }) => {
        await seedPreferences(page, { theme: scheme, language: 'pt' });
        const pages = [
          ['inicio', '/'],
          ['cartoes', '/cards'],
          ['configuracoes', '/settings'],
          ...(viewport === 'mobile' ? [['mais', '/more']] : []),
        ] as const;
        for (const [name, path] of pages) {
          await page.goto(path);
          await waitForApp(page);
          await page.evaluate(() => document.fonts.ready);
          await expectNoHorizontalScroll(page);
          await page.screenshot({
            path: `${OUT_DIR}/${SIZE[viewport]}-${tema}-${name}.png`,
            fullPage: false,
          });
        }
      });

      test(`inicio com dados ${viewport} ${scheme}`, async ({ page }) => {
        await seedPreferences(page, { theme: scheme, language: 'pt' });
        await seedMockResponses(page, homeResponses());
        await page.goto('/');
        await waitForApp(page);
        await page.locator('[data-cy="home-chart-totals"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(450);
        await expectNoHorizontalScroll(page);
        const file = `${OUT_DIR}/${SIZE[viewport]}-${tema}-inicio-dados`;
        await page.screenshot({ path: `${file}.png`, fullPage: false });
        await page.screenshot({ path: `${file}-completo.png`, fullPage: true });
      });

      test(`busca global ${viewport} ${scheme}`, async ({ page }) => {
        await seedPreferences(page, { theme: scheme, language: 'pt' });
        await seedMockResponses(page, homeResponses());
        await page.goto('/');
        await waitForApp(page);
        await page.locator('[data-cy="home-chart-totals"]').waitFor();
        if (viewport === 'mobile') await page.locator('[data-cy="global-search-open"]').click();
        else await page.locator('[data-cy="global-search-input"]').click();
        await page.locator('[data-cy="global-search-input"]').fill('mercado');
        await page.locator('[data-cy="global-search-results"]').waitFor();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(350);
        await page.screenshot({
          path: `${OUT_DIR}/${SIZE[viewport]}-${tema}-busca.png`,
          fullPage: false,
        });
      });

      test(`graficos ${viewport} ${scheme}`, async ({ page }) => {
        await seedPreferences(page, { theme: scheme, language: 'pt' });
        await page.goto('/dev/ui-kit');
        await waitForApp(page);
        const block = page.locator(`[data-cy="${scheme}-charts"]`);
        for (const name of [
          'line-chart',
          'line-negative',
          'line-single',
          'bar-list',
          'segmented',
        ]) {
          await page.locator(`[data-cy="${scheme}-${name}"]`).scrollIntoViewIfNeeded();
          await page.waitForTimeout(450);
        }
        await block.scrollIntoViewIfNeeded();
        const plot = page.locator(`[data-cy="${scheme}-line-chart-plot"]`);
        await plot.focus();
        await page.keyboard.press('End');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await block.scrollIntoViewIfNeeded();
        await block.screenshot({ path: `${OUT_DIR}/${SIZE[viewport]}-${tema}-graficos.png` });
      });
    });
  }
}

test.describe('janela e menu do perfil (1280, claro e escuro)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`menu do avatar aberto, ${scheme}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await seedPreferences(page, { theme: scheme, language: 'pt' });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await waitForApp(page);
      await page.locator('[data-cy="header-profile"]').click();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${OUT_DIR}/1280-${scheme === 'light' ? 'claro' : 'escuro'}-menu-perfil.png`,
      });
    });
  }
});
