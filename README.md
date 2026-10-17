# moneylog frontend

[![ci](https://github.com/matheusmartinsviana/moneylog-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/matheusmartinsviana/moneylog-frontend/actions/workflows/ci.yml)
[![codeql](https://github.com/matheusmartinsviana/moneylog-frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/matheusmartinsviana/moneylog-frontend/actions/workflows/codeql.yml)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

Interface do [moneylog](https://github.com/matheusmartinsviana/moneylog), um controle financeiro pessoal em PWA
mobile-first. Angular 22 (standalone, zoneless, OnPush), tema claro e escuro, português, inglês e espanhol.
A tela só exibe o que a API calcula; o contrato OpenAPI é a fonte da verdade.

## Requisitos

Node 24 e npm 11 (`.nvmrc`).

## Rodando

```bash
npm ci
npm start             # API real: proxy de /v1 para http://localhost:8080
npm run start:mock    # sem backend, com dados de demonstração
```

| Script                    | O que faz                                                |
| ------------------------- | -------------------------------------------------------- |
| `npm run build`           | build de produção (gera service worker e manifest)       |
| `npm test`                | testes unitários (Vitest), sem cobertura                 |
| `npm run test:ci`         | os mesmos testes com cobertura e limite mínimo           |
| `npm run e2e`             | Playwright (Chromium e WebKit) sem backend               |
| `npm run e2e:integration` | Playwright contra Postgres e backend reais               |
| `npm run lint`            | ESLint, regras visuais, contraste e controles nativos    |
| `npm run lint:deps`       | fronteiras entre camadas e ciclos (`dependency-cruiser`) |
| `npm run typecheck`       | `ngc` com templates estritos e `tsc` dos testes          |
| `npm run api:types`       | gera `src/util/api/schema.gen.ts` a partir do contrato   |
| `npm run api:check`       | falha se o `schema.gen.ts` está desatualizado            |
| `npm run format`          | Prettier                                                 |

## Contrato

`contracts/openapi.yaml` é uma cópia do contrato do backend. Para atualizar:

```bash
npm run contract:sync && npm run api:types
```

Só `src/modules/*/infra` importa `schema.gen.ts`; o resto do app usa os tipos do `core` de cada módulo.

## HTTPS local

O cookie de sessão é `Secure` e o Safari o descarta em `http://localhost`. Para testar no iPhone, use HTTPS local com
[mkcert](https://github.com/FiloSottile/mkcert):

```bash
brew install mkcert && mkcert -install
mkdir -p ~/.moneylog/certs && cd ~/.moneylog/certs
mkcert -cert-file moneylog.localhost.pem -key-file moneylog.localhost-key.pem moneylog.localhost localhost 127.0.0.1
npm run start:local   # https://moneylog.localhost:4200
```

Os certificados ficam fora do repositório (nunca versione `*.pem`). No Chrome e no Firefox, `npm start` basta.

## E2E com backend real

`npm run e2e:integration` sobe um Postgres descartável e o backend (`./mvnw spring-boot:run`, perfil `dev`), gera as
credenciais a cada execução e as mantém só no ambiente dos processos. Requer Docker, JDK 21 (`JAVA_HOME`) e `htpasswd`.

## Estrutura

```
src/
├── app/       shell, rotas, features (telas) e componentes comuns
├── modules/   domínio por módulo: core (tipos, facades) e infra (gateways HTTP)
├── util/      cliente da API, helpers
├── styles/    tokens e utilitários CSS
└── assets/    fontes, ícones, imagens
```

Os commits seguem Conventional Commits; os hooks (Husky) rodam commitlint, lint-staged e `lint:deps`.
