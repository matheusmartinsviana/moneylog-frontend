import {
  BOTTOM_NAV_LABELS,
  BOTTOM_NAV_ORDER,
  BOTTOM_NAV_SHORT_LABELS,
  expect,
  expectNoHorizontalScroll,
  Lang,
  NAV_LABELS,
  ROUTES,
  seedPreferences,
  test,
  VIEWPORTS,
  waitForApp,
} from './support';

const LANGS: Lang[] = ['pt', 'en', 'es'];

test.describe('barra inferior em 375 × 812 (S-56)', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  for (const lang of LANGS) {
    test(`idioma ${lang}: os 5 rótulos aparecem inteiros, com ≥ 10 px e sem reticências`, async ({
      page,
    }) => {
      await seedPreferences(page, { language: lang });
      for (const route of ROUTES) {
        await page.goto(route.path);
        await waitForApp(page);

        const labels = await page
          .locator('[data-cy="bottom-nav"] .bottom-nav__label')
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const style = getComputedStyle(node);
              return {
                text: (node as HTMLElement).innerText.trim(),
                scrollWidth: node.scrollWidth,
                clientWidth: node.clientWidth,
                fontSize: Number.parseFloat(style.fontSize),
                textOverflow: style.textOverflow,
              };
            }),
          );

        expect(
          labels.map((label) => label.text),
          route.path,
        ).toEqual(
          BOTTOM_NAV_ORDER.map(
            (key) => BOTTOM_NAV_SHORT_LABELS[lang][key] ?? BOTTOM_NAV_LABELS[lang][key],
          ),
        );
        for (const label of labels) {
          expect(label.scrollWidth, `"${label.text}" cabe em ${route.path}`).toBeLessThanOrEqual(
            label.clientWidth,
          );
          expect(label.fontSize, `"${label.text}" com fonte ≥ 10 px`).toBeGreaterThanOrEqual(10);
          expect(label.textOverflow, `"${label.text}" sem reticências`).not.toBe('ellipsis');
        }
        await expectNoHorizontalScroll(page);
      }
    });
  }

  test('o nome acessível de cada item contém o texto visível (WCAG 2.5.3)', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    for (const key of BOTTOM_NAV_ORDER) {
      const link = page.locator(`[data-cy="bottom-nav-${key}"]`);
      const visible = (await link.locator('.bottom-nav__label').innerText()).trim();
      await expect(link).toHaveAccessibleName(new RegExp(visible));
    }
  });
});

test.describe('"Novo registro" é o nome único de /quick-add (S-57)', () => {
  for (const lang of LANGS) {
    const name = NAV_LABELS[lang]['quickAdd']!;

    test(`idioma ${lang} em 1280: botão da sidebar e título da página são "${name}"`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await seedPreferences(page, { language: lang });
      await page.goto('/');
      await waitForApp(page);

      const button = page.locator('[data-cy="sidebar-quickAdd"]');
      await expect(button).toHaveText(name);
      await expect(button).toHaveAccessibleName(name);
      await button.click();
      await expect(page).toHaveURL(/\(modal:quick-add\)$/);
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test(`idioma ${lang} em 375: a barra não tem o "+" e /quick-add abre "${name}"`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await seedPreferences(page, { language: lang });
      await page.goto('/quick-add');
      await waitForApp(page);
      await expect(page.locator('[data-cy="bottom-nav-quickAdd"]')).toHaveCount(0);
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/captura rápida|quick capture/i);
    });
  }
});
