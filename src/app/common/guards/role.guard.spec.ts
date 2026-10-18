import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { ownerGuard } from '~/app/common/guards/role.guard';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import {
  aToken,
  AuthGatewayStub,
  MEMBER_USER,
  OWNER_USER,
  provideAuthStub,
} from '~/testing/auth-testing';

@Component({ selector: 'app-dummy', template: '' })
class DummyComponent {}

async function setup(user: typeof OWNER_USER | null) {
  const gateway = new AuthGatewayStub();
  if (user) gateway.refresh$ = of(aToken('t', user));
  TestBed.configureTestingModule({
    providers: [
      provideAuthStub(gateway),
      provideRouter([
        { path: 'ai', canMatch: [ownerGuard], component: DummyComponent },
        { path: 'mcp', canMatch: [ownerGuard], component: DummyComponent },
        { path: '', component: DummyComponent },
      ]),
    ],
  });
  if (user) await TestBed.inject(SessionFacade).restore();
  return TestBed.inject(Router);
}

describe('ownerGuard', () => {
  it('Dado o dono, quando abro /ai por URL direta, então a rota abre', async () => {
    const router = await setup(OWNER_USER);

    await router.navigateByUrl('/ai');

    expect(router.url).toBe('/ai');
  });

  it.each(['/ai', '/mcp'])(
    'Dado um convidado, quando abro %s por URL direta, então volta para o início',
    async (url) => {
      const router = await setup(MEMBER_USER);

      await router.navigateByUrl(url);

      expect(router.url).toBe('/');
    },
  );

  it('Dado sem papel conhecido, quando abro /mcp, então volta para o início', async () => {
    const router = await setup(null);

    await router.navigateByUrl('/mcp');

    expect(router.url).toBe('/');
  });
});
