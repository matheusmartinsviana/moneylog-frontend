import type { Page, Route } from '@playwright/test';

export const OWNER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dono@moneylog.app',
  role: 'OWNER',
} as const;
export const MEMBER = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'convidado@moneylog.app',
  role: 'MEMBER',
} as const;
export const SECOND_MEMBER = {
  id: '00000000-0000-4000-8000-000000000003',
  email: 'segundo@moneylog.app',
  role: 'MEMBER',
} as const;

export interface StubUser {
  id: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
}

export interface StubInvitation {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  lastSentAt: string;
  deliveryStatus: 'SENT' | 'FAILED';
}

export interface StubManagedUser extends StubUser {
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface StubFailure {
  status: number;
  code?: string;
  extra?: Record<string, unknown>;
  retryAfter?: number;
}

export interface Stub {
  session: StubUser | null;
  users: StubManagedUser[];
  invitations: StubInvitation[];
  previewEmail: string;
  previewInvitedBy: string | null;
  failures: Map<string, StubFailure[]>;
  calls: { method: string; path: string; body: unknown }[];
  fail(key: string, ...failures: StubFailure[]): void;
  callsTo(method: string, path: string): { method: string; path: string; body: unknown }[];
}

export function managedUser(
  user: StubUser,
  overrides: Partial<StubManagedUser> = {},
): StubManagedUser {
  return {
    ...user,
    status: 'ACTIVE',
    createdAt: '2026-10-01T12:00:00Z',
    lastLoginAt: null,
    ...overrides,
  };
}

export function invitation(
  id: string,
  email: string,
  overrides: Partial<StubInvitation> = {},
): StubInvitation {
  return {
    id,
    email,
    status: 'PENDING',
    createdAt: '2026-10-18T12:00:00Z',
    expiresAt: '2099-10-25T12:00:00Z',
    acceptedAt: null,
    lastSentAt: '2026-10-18T12:00:00Z',
    deliveryStatus: 'SENT',
    ...overrides,
  };
}

export function createStub(
  initial: Partial<
    Pick<Stub, 'session' | 'users' | 'invitations' | 'previewEmail' | 'previewInvitedBy'>
  > = {},
): Stub {
  const stub: Stub = {
    session: initial.session === undefined ? OWNER : initial.session,
    users: initial.users ?? [managedUser(OWNER, { lastLoginAt: '2026-10-19T09:30:00Z' })],
    invitations: initial.invitations ?? [],
    previewEmail: initial.previewEmail ?? MEMBER.email,
    previewInvitedBy: initial.previewInvitedBy === undefined ? 'Matheus' : initial.previewInvitedBy,
    failures: new Map(),
    calls: [],
    fail(key, ...failures) {
      stub.failures.set(key, failures);
    },
    callsTo(method, path) {
      return stub.calls.filter((call) => call.method === method && call.path === path);
    },
  };
  return stub;
}

function problem(route: Route, failure: StubFailure): Promise<void> {
  const headers: Record<string, string> = {};
  if (failure.retryAfter !== undefined) headers['Retry-After'] = String(failure.retryAfter);
  return route.fulfill({
    status: failure.status,
    contentType: 'application/problem+json',
    headers,
    body: JSON.stringify({
      status: failure.status,
      code: failure.code ?? 'INTERNAL_ERROR',
      title: 'erro',
      ...failure.extra,
    }),
  });
}

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function tokenFor(user: StubUser) {
  return { accessToken: `stub-token-${user.id}`, expiresAt: '2099-12-31T00:00:00Z', user };
}

export async function installStub(page: Page, stub: Stub): Promise<void> {
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const raw = request.postData();
    const body: unknown = raw ? JSON.parse(raw) : null;
    stub.calls.push({ method, path, body });

    const key = `${method} ${path}`;
    const queued = stub.failures.get(key);
    if (queued && queued.length > 0) {
      const failure = queued.length > 1 ? queued.shift()! : queued[0]!;
      return problem(route, failure);
    }

    if (key === 'POST /v1/auth/refresh') {
      return stub.session
        ? json(route, tokenFor(stub.session))
        : problem(route, { status: 401, code: 'REFRESH_INVALID' });
    }
    if (key === 'GET /v1/auth/status') return json(route, { passwordSetupRequired: false });
    if (key === 'POST /v1/auth/logout') {
      stub.session = null;
      return route.fulfill({ status: 204 });
    }
    if (key === 'POST /v1/invitations/preview') {
      return json(route, {
        email: stub.previewEmail,
        expiresAt: '2099-12-31T00:00:00Z',
        invitedByName: stub.previewInvitedBy,
      });
    }
    if (key === 'POST /v1/invitations/accept') {
      const user = { ...MEMBER, email: stub.previewEmail };
      stub.session = user;
      return json(route, tokenFor(user));
    }
    if (key === 'GET /v1/users') return json(route, stub.users);
    if (key === 'GET /v1/invitations') return json(route, stub.invitations);
    if (key === 'POST /v1/invitations') {
      const email = (body as { email: string }).email;
      const created = invitation(
        `00000000-0000-4000-8000-0000000000${10 + stub.invitations.length}`,
        email,
      );
      stub.invitations = [created, ...stub.invitations];
      return json(route, created, 201);
    }

    const resend = /^\/v1\/invitations\/([^/]+)\/resend$/.exec(path);
    if (method === 'POST' && resend) {
      const found = stub.invitations.find((item) => item.id === resend[1]);
      if (!found) return problem(route, { status: 404, code: 'INVITATION_NOT_FOUND' });
      found.deliveryStatus = 'SENT';
      found.lastSentAt = '2026-10-20T12:00:00Z';
      return json(route, found);
    }
    const revoke = /^\/v1\/invitations\/([^/]+)$/.exec(path);
    if (method === 'DELETE' && revoke) {
      const found = stub.invitations.find((item) => item.id === revoke[1]);
      if (!found) return problem(route, { status: 404, code: 'INVITATION_NOT_FOUND' });
      found.status = 'REVOKED';
      return json(route, found);
    }
    const toggle = /^\/v1\/users\/([^/]+)\/(disable|enable)$/.exec(path);
    if (method === 'POST' && toggle) {
      const found = stub.users.find((item) => item.id === toggle[1]);
      if (!found) return problem(route, { status: 404, code: 'USER_NOT_FOUND' });
      found.status = toggle[2] === 'disable' ? 'DISABLED' : 'ACTIVE';
      return json(route, found);
    }

    return problem(route, { status: 404, code: 'NOT_FOUND' });
  });
}
