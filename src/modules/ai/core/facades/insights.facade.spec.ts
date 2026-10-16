import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InsightsFacade } from '~/modules/ai/core/facades/insights.facade';
import { AiGatewayStub, anInsight, provideAiStub } from '~/testing/ai-testing';

describe('InsightsFacade', () => {
  it('Dado insights, então o destaque é o primeiro, na ordem da API', () => {
    const gateway = new AiGatewayStub();
    gateway.insightsResult = () =>
      of({
        items: [anInsight({ key: 'insight.card.committed' }), anInsight()],
        hasNext: false,
      });
    TestBed.configureTestingModule({ providers: [provideAiStub(gateway), InsightsFacade] });
    const facade = TestBed.inject(InsightsFacade);

    facade.load(null);

    expect(facade.top()?.key).toBe('insight.card.committed');
  });

  it('Dado nenhum insight, então não há destaque', () => {
    TestBed.configureTestingModule({ providers: [provideAiStub(), InsightsFacade] });
    const facade = TestBed.inject(InsightsFacade);

    facade.load(null);

    expect(facade.top()).toBeNull();
    expect(facade.state().status).toBe('empty');
  });
});
