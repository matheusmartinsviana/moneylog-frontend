# `src/modules`: negócio

Um contexto por pasta (`modules/<contexto>/`):

| Pasta        | Conteúdo                                                                                | Pode importar                                   |
| ------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `core/`      | tipos, enums, portas (interfaces), facades de negócio com o estado da tela, estratégias | `core` do mesmo módulo, `src/util`              |
| `infra/`     | gateways HTTP, mapeamento de respostas, `endpoints.ts`, providers                       | `core` do mesmo módulo, `mock-data`, `src/util` |
| `mock-data/` | dados de demonstração usados no ambiente mock                                           | —                                               |

Proibido (a regra falha em `npm run lint:deps`): `core` importar `app` ou `infra`, `core` usar `@angular/common/http`,
`infra` importar `app`, um módulo importar outro e ciclos. Só `infra` importa o `schema.gen.ts` gerado do contrato.

Os cálculos financeiros são do backend: o frontend não soma nem subtrai valores, só exibe o que a API devolve.

Cada módulo registra seus providers por uma função `provide<Modulo>()`, chamada apenas em `app.config.ts`, que liga a
porta do `core` à implementação da `infra`.
