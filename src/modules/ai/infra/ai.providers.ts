import { Provider } from '@angular/core';

import { AiGateway } from '~/modules/ai/core/interfaces/ai.gateway';
import { AiRequestsFacade } from '~/modules/ai/infra/facades/ai-requests.facade';

export function provideAi(): Provider[] {
  return [{ provide: AiGateway, useExisting: AiRequestsFacade }];
}
