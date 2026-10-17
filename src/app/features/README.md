# `src/app/features`

Uma pasta **plana** por seção (sem feature dentro de feature):

```
<feature>/
├── <feature>.routes.ts   rotas da seção, com `export default` (carregado por loadChildren)
├── pages/                componentes smart (falam com a facade de negócio)
├── components/           presentational da seção (quando houver)
└── utils/ constants/
```

Seções: `home` (dashboard ligado ao módulo `dashboard`), `transactions`, `quick-add`, `goals`, `more`, `accounts`, `cards`, `people`,
`planning`, `notes`, `import`, `insights`, `settings` e `not-found`. As demais mostram o estado vazio com
as ações desabilitadas e a dica "disponível em breve".

Uma feature não importa outra feature nem `src/modules/*/infra`.
