import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { InvitationsGateway } from '~/modules/users/core/interfaces/invitations.gateway';
import { UsersGateway } from '~/modules/users/core/interfaces/users.gateway';
import { INVITATIONS_ENDPOINTS, USERS_ENDPOINTS } from '~/modules/users/infra/endpoints';
import { InvitationsRequestsFacade } from '~/modules/users/infra/facades/invitations-requests.facade';
import { UsersRequestsFacade } from '~/modules/users/infra/facades/users-requests.facade';
import { provideUsers } from '~/modules/users/infra/users.providers';
import { problemOf } from '~/util/api/problem';
import { API_MOCKS } from '~/util/api-mocks';

function setup(useMocks: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_MOCKS, useValue: useMocks },
      provideUsers(),
    ],
  });
  return {
    users: TestBed.inject(UsersGateway),
    invitations: TestBed.inject(InvitationsGateway),
    http: TestBed.inject(HttpTestingController),
  };
}

const invitationBody = {
  id: 'inv-1',
  email: 'novo@moneylog.app',
  status: 'PENDING',
  createdAt: '2026-10-18T12:00:00Z',
  expiresAt: '2026-10-25T12:00:00Z',
  lastSentAt: '2026-10-18T12:00:00Z',
  deliveryStatus: 'SENT',
};

describe('Requisições de usuários e convites', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Dado o bootstrap, então as portas são as facades de requisições', () => {
    setup(true);
    expect(TestBed.inject(UsersGateway)).toBe(TestBed.inject(UsersRequestsFacade));
    expect(TestBed.inject(InvitationsGateway)).toBe(TestBed.inject(InvitationsRequestsFacade));
  });

  it('Dado o mock, então devolve dados fixos sem requisição', async () => {
    const { users, invitations, http } = setup(true);

    expect((await firstValueFrom(users.list())).length).toBeGreaterThan(0);
    expect((await firstValueFrom(invitations.create('a@b.co'))).email).toBe('a@b.co');
    http.expectNone(() => true);
  });

  it('Dado a lista de usuários, então GET /v1/users e normaliza lastLoginAt ausente para null', async () => {
    const { users, http } = setup(false);

    const result = firstValueFrom(users.list());
    const req = http.expectOne(USERS_ENDPOINTS.list);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'u1',
        email: 'a@b.co',
        role: 'MEMBER',
        status: 'ACTIVE',
        createdAt: '2026-10-01T00:00:00Z',
      },
    ]);

    expect((await result)[0]?.lastLoginAt).toBeNull();
  });

  it('Dado desativar e reativar, então POST sem corpo no caminho do usuário', async () => {
    const { users, http } = setup(false);
    const user = { id: 'u1', email: 'a@b.co', role: 'MEMBER', createdAt: '2026-10-01T00:00:00Z' };

    const disabled = firstValueFrom(users.disable('u1'));
    const off = http.expectOne(USERS_ENDPOINTS.disable('u1'));
    expect(off.request.method).toBe('POST');
    expect(off.request.body).toBeNull();
    off.flush({ ...user, status: 'DISABLED' });
    expect((await disabled).status).toBe('DISABLED');

    const enabled = firstValueFrom(users.enable('u1'));
    http.expectOne(USERS_ENDPOINTS.enable('u1')).flush({ ...user, status: 'ACTIVE' });
    expect((await enabled).status).toBe('ACTIVE');
  });

  it('Dado criar convite, então POST /v1/invitations só com o e-mail', async () => {
    const { invitations, http } = setup(false);

    const result = firstValueFrom(invitations.create('novo@moneylog.app'));
    const req = http.expectOne(INVITATIONS_ENDPOINTS.collection);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'novo@moneylog.app' });
    req.flush(invitationBody, { status: 201, statusText: 'Created' });

    expect(await result).toEqual(expect.objectContaining({ id: 'inv-1', acceptedAt: null }));
  });

  it('Dado listar, reenviar e revogar, então usa GET, POST /resend sem corpo e DELETE no convite', async () => {
    const { invitations, http } = setup(false);

    const list = firstValueFrom(invitations.list());
    http.expectOne(INVITATIONS_ENDPOINTS.collection).flush([invitationBody]);
    expect((await list).length).toBe(1);

    const resent = firstValueFrom(invitations.resend('inv-1'));
    const resend = http.expectOne(INVITATIONS_ENDPOINTS.resend('inv-1'));
    expect(resend.request.method).toBe('POST');
    expect(resend.request.body).toBeNull();
    resend.flush(invitationBody);
    await resent;

    const revoked = firstValueFrom(invitations.revoke('inv-1'));
    const revoke = http.expectOne(INVITATIONS_ENDPOINTS.item('inv-1'));
    expect(revoke.request.method).toBe('DELETE');
    revoke.flush({ ...invitationBody, status: 'REVOKED' });
    expect((await revoked).status).toBe('REVOKED');
  });

  it('Dado 409 INVITATION_PENDING com invitationId, então o erro carrega o id do convite existente', async () => {
    const { invitations, http } = setup(false);

    const result = firstValueFrom(invitations.create('a@b.co')).catch((e: unknown) => e);
    http
      .expectOne(INVITATIONS_ENDPOINTS.collection)
      .flush(
        { status: 409, code: 'INVITATION_PENDING', invitationId: 'inv-9' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(problemOf(await result).invitationId).toBe('inv-9');
  });
});
