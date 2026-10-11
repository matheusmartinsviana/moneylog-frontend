import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..');
const PROJECT = 'moneylog-e2e-run';
const PG_PORT = '55433';
const ORIGIN = 'http://localhost:4400';

function bcrypt(password: string): string {
  const attempts: [string, string[]][] = [
    ['htpasswd', ['-bnBC', '10', '', password]],
    [
      'python3',
      [
        '-c',
        `import bcrypt,sys;print(':'+bcrypt.hashpw(sys.argv[1].encode(),bcrypt.gensalt(10)).decode())`,
        password,
      ],
    ],
  ];
  for (const [cmd, args] of attempts) {
    try {
      const out = execFileSync(cmd, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return out
        .trim()
        .replace(/^:/, '')
        .replace(/^\$2y\$/, '$2a$');
    } catch {}
  }
  throw new Error(
    'E2E stack: precisa de `htpasswd` (apache2-utils) ou `python3` com o pacote bcrypt para gerar o hash do dono.',
  );
}

async function waitFor(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `E2E stack: ${url} não respondeu em ${timeoutMs / 1000}s (veja e2e/.results/backend.log)`,
  );
}

export default async function globalSetup(): Promise<(() => Promise<void>) | void> {
  if (process.env['E2E_STACK'] === 'external') {
    for (const v of ['E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD']) {
      if (!process.env[v]) throw new Error(`E2E_STACK=external exige ${v}`);
    }
    return;
  }

  const javaHome =
    process.env['JAVA_HOME'] ?? '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home';
  const password = `E2e-${randomBytes(9).toString('base64url')}!`;
  const secrets = {
    DB_NAME: 'moneylog_e2e',
    DB_PORT: PG_PORT,
    DB_USER: 'moneylog',
    DB_PASSWORD: randomBytes(12).toString('hex'),
    JWT_SECRET: randomBytes(48).toString('base64'),
    MONEYLOG_OWNER_EMAIL: 'dono-e2e@moneylog.test',
  };
  const workDir = mkdtempSync(join(tmpdir(), 'moneylog-e2e-'));
  const hashFile = join(workDir, 'owner.hash');
  writeFileSync(hashFile, bcrypt(password), { mode: 0o600 });

  const env = {
    ...process.env,
    ...secrets,
    JAVA_HOME: javaHome,
    DB_URL: `jdbc:postgresql://localhost:${PG_PORT}/${secrets.DB_NAME}`,
    MONEYLOG_OWNER_PASSWORD_HASH_FILE: hashFile,
    MONEYLOG_ALLOWED_ORIGINS: `${ORIGIN},https://localhost:4200`,
    MONEYLOG_TRUSTED_PROXIES: '',
  };
  Object.assign(process.env, {
    ...secrets,
    DB_URL: env.DB_URL,
    JWT_SECRET: secrets.JWT_SECRET,
    E2E_OWNER_EMAIL: secrets.MONEYLOG_OWNER_EMAIL,
    E2E_OWNER_PASSWORD: password,
    E2E_PG_CONTAINER: `${PROJECT}-postgres-1`,
  });

  execFileSync(
    'docker',
    ['compose', '-p', PROJECT, '-f', join(ROOT, 'docker-compose.yml'), 'up', '-d', '--wait'],
    {
      env,
      stdio: 'inherit',
    },
  );

  mkdirSync(resolve(__dirname, '..', '.results'), { recursive: true });
  const logPath = resolve(__dirname, '..', '.results', 'backend.log');
  const log = openSync(logPath, 'w');
  const backend: ChildProcess = spawn(
    './mvnw',
    ['-q', 'spring-boot:run', '-Dspring-boot.run.profiles=dev'],
    {
      cwd: join(ROOT, 'backend'),
      env,
      detached: true,
      stdio: ['ignore', log, log],
    },
  );
  closeSync(log);

  try {
    await waitFor('http://localhost:8080/actuator/health', 180_000);
  } catch (error) {
    await teardown();
    throw error;
  }

  async function teardown(): Promise<void> {
    if (backend.pid) {
      try {
        process.kill(-backend.pid, 'SIGTERM');
      } catch {}
    }
    try {
      execFileSync(
        'docker',
        ['compose', '-p', PROJECT, '-f', join(ROOT, 'docker-compose.yml'), 'down', '-v'],
        {
          env,
          stdio: 'ignore',
        },
      );
    } catch {}
    if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
  }

  return teardown;
}
