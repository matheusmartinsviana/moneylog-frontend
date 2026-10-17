import { existsSync } from 'node:fs';

const DOCKER_CANDIDATES = [
  '/usr/local/bin/docker',
  '/opt/homebrew/bin/docker',
  '/usr/bin/docker',
  '/Applications/Docker.app/Contents/Resources/bin/docker',
];

export function dockerBinary(): string {
  const configured = process.env['DOCKER_BIN'];
  if (configured) return configured;
  const found = DOCKER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (found) return found;
  throw new Error(
    `E2E stack: docker não encontrado em ${DOCKER_CANDIDATES.join(', ')}; defina DOCKER_BIN com o caminho do binário.`,
  );
}
