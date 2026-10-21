import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen } from '@testing-library/angular';

import { pt } from '~/app/common/i18n/translations/pt';
import settingsRoutes from '~/app/features/settings/settings.routes';
import { AccountsGatewayStub, provideAccountsStub } from '~/testing/accounts-testing';
import { AuthGatewayStub, provideAuthStub } from '~/testing/auth-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { provideQuickEntryStub, QuickEntryGatewayStub } from '~/testing/quick-entry-testing';

describe('ShortcutGuidePage', () => {
  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting('pt'),
        provideRouter([{ path: 'settings', children: settingsRoutes }]),
        provideAuthStub(new AuthGatewayStub()),
        provideQuickEntryStub(new QuickEntryGatewayStub()),
        provideAccountsStub(new AccountsGatewayStub()),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return harness;
  }

  it('Dado a rota /settings/shortcuts/guide, então mostra o guia com os 7 passos e o botão voltar para os atalhos', async () => {
    await open('/settings/shortcuts/guide');

    expect(TestBed.inject(Router).url).toBe('/settings/shortcuts/guide');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      pt.quickEntry.guide.heading,
    );
    expect(screen.getByTestId('shortcut-guide-steps').querySelectorAll('li')).toHaveLength(7);
    expect(screen.getByTestId('shortcut-guide-back')).toHaveAttribute(
      'href',
      '/settings/shortcuts',
    );
  });

  it('Dado a página de atalhos, então o guia não aparece nela', async () => {
    await open('/settings/shortcuts');

    expect(screen.queryByTestId('shortcut-guide')).toBeNull();
    expect(screen.getByTestId('shortcut-guide-link')).toBeInTheDocument();
  });
});
