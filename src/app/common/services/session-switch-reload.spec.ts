import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { HardNavigation } from '~/app/common/services/hard-navigation';
import { SessionSwitchReload } from '~/app/common/services/session-switch-reload';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import {
  aToken,
  AuthGatewayStub,
  MEMBER_USER,
  OWNER_USER,
  provideAuthStub,
} from '~/testing/auth-testing';

async function setup(url: string) {
  const gateway = new AuthGatewayStub();
  const hardNavigation = { go: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideAuthStub(gateway),
      provideRouter([{ path: '**', children: [] }]),
      { provide: HardNavigation, useValue: hardNavigation },
    ],
  });
  await TestBed.inject(Router).navigateByUrl(url);
  TestBed.inject(SessionSwitchReload).start();
  return { gateway, hardNavigation, session: TestBed.inject(SessionFacade) };
}

describe('SessionSwitchReload', () => {
  beforeEach(() => localStorage.clear());

  it('Dado o refresh trazendo outro usuário, quando a troca é detectada, então recarrega o app em /', async () => {
    const { gateway, hardNavigation, session } = await setup('/transactions');
    await session.restore();
    gateway.refresh$ = of(aToken('t2', MEMBER_USER));

    session.refresh().subscribe();

    expect(hardNavigation.go).toHaveBeenCalledTimes(1);
    expect(hardNavigation.go).toHaveBeenCalledWith('/');
  });

  it('Dado a troca ocorrendo na tela de entrada, então recarrega no destino seguro do returnUrl', async () => {
    const { gateway, hardNavigation, session } = await setup('/login?returnUrl=%2Ftransactions');
    gateway.refresh$ = of(aToken('t1', OWNER_USER));
    await session.restore();
    gateway.refresh$ = of(aToken('t2', MEMBER_USER));

    session.refresh().subscribe();

    expect(hardNavigation.go).toHaveBeenCalledWith('/transactions');
  });

  it('Dado o mesmo usuário renovando, então não recarrega', async () => {
    const { hardNavigation, session } = await setup('/transactions');
    await session.restore();

    session.refresh().subscribe();

    expect(hardNavigation.go).not.toHaveBeenCalled();
  });
});
