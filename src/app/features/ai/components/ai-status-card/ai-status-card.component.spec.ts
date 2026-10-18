import { render, screen } from '@testing-library/angular';
import { throwError } from 'rxjs';

import { AiStatusCardComponent } from '~/app/features/ai/components/ai-status-card/ai-status-card.component';
import { AiStatusFacade } from '~/modules/ai/core/facades/ai-status.facade';
import { aProblem } from '~/testing/accounts-testing';
import { AiGatewayStub, provideAiStub } from '~/testing/ai-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { ProblemError } from '~/util/api/problem';

async function setup(status: number, code: string) {
  const gateway = new AiGatewayStub();
  gateway.statusResult = () => throwError(() => new ProblemError(aProblem(status, code)));
  const result = await render(AiStatusCardComponent, {
    providers: [provideI18nTesting('pt'), provideAiStub(gateway)],
  });
  result.fixture.debugElement.injector.get(AiStatusFacade).ensureLoaded();
  await result.fixture.whenStable();
  return result;
}

describe('AiStatusCardComponent: erros', () => {
  it('Dado 403 do backend, então mostra a mensagem de permissão e não oferece tentar de novo', async () => {
    await setup(403, 'FORBIDDEN');

    expect(await screen.findByTestId('ai-status-forbidden')).toHaveTextContent(
      'Esta área é só para quem administra a conta.',
    );
    expect(screen.queryByTestId('ai-status-retry')).toBeNull();
  });

  it('Dado erro de servidor, então mostra o erro com tentar de novo', async () => {
    await setup(500, 'INTERNAL_ERROR');

    expect(await screen.findByTestId('ai-status-error')).toBeInTheDocument();
    expect(screen.getByTestId('ai-status-retry')).toBeInTheDocument();
  });
});
