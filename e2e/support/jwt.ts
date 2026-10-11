import { createHmac, randomUUID } from 'node:crypto';

const b64 = (v: object | Buffer): string =>
  (Buffer.isBuffer(v) ? v : Buffer.from(JSON.stringify(v))).toString('base64url');

export function subjectOf(accessToken: string): string {
  const payload = JSON.parse(Buffer.from(accessToken.split('.')[1] ?? '', 'base64url').toString());
  return payload.sub as string;
}

export function expiredAccessToken(
  subject: string,
  secret = process.env['JWT_SECRET'] ?? '',
): string {
  if (!secret) throw new Error('JWT_SECRET não está no ambiente do teste');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'HS256' });
  const body = b64({ sub: subject, iat: now - 1000, exp: now - 100, jti: randomUUID() });
  const sig = b64(
    createHmac('sha256', Buffer.from(secret, 'utf8')).update(`${head}.${body}`).digest(),
  );
  return `${head}.${body}.${sig}`;
}
