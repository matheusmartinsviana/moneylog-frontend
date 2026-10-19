import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';

import { MorePage } from '~/app/features/more/pages/more.page';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { provideAiStub } from '~/testing/ai-testing';
import {
  aToken,
  AuthGatewayStub,
  MEMBER_USER,
  OWNER_USER,
  provideAuthStub,
} from '~/testing/auth-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup(user: typeof OWNER_USER) {
  const gateway = new AuthGatewayStub();
  gateway.refresh$ = of(aToken('t', user));
  const view = await render(MorePage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideAuthStub(gateway),
      provideAiStub(),
    ],
  });
  await view.fixture.debugElement.injector.get(SessionFacade).restore();
  view.fixture.detectChanges();
  return view;
}

describe('MorePage: papel', () => {
  it('Dado o dono, quando abre "Mais", então vê IA e MCP', async () => {
    await setup(OWNER_USER);

    expect(screen.getByTestId('more-ai')).toBeInTheDocument();
    expect(screen.getByTestId('more-mcp')).toBeInTheDocument();
  });

  it('Dado um convidado, quando abre "Mais", então não vê IA nem MCP, mas vê o cofre e a importação', async () => {
    await setup(MEMBER_USER);

    expect(screen.queryByTestId('more-ai')).toBeNull();
    expect(screen.queryByTestId('more-mcp')).toBeNull();
    expect(screen.getByTestId('more-vault')).toBeInTheDocument();
    expect(screen.getByTestId('more-import')).toBeInTheDocument();
  });
});
