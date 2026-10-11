# `src/assets`

Arquivos estáticos servidos em `/assets` (os README são ignorados no build).

- `brand/logo-on-light.png` (recibo escuro) e `brand/logo-on-dark.png` (recibo branco): o logo da interface, um por tema
  (sidebar e login; o CSS escolhe pelos tokens `--logo-on-*-display`).
- `icons/*.png`: **gerados** por `npm run icons` a partir da arte do dono em `brand/` (mestres `logo-any`, `logo-maskable`,
  `logo-apple` e `logo-badge`; as artes originais estão em `brand/recibo-escuro.png` e `brand/recibo-branco.png` e
  `brand/make-masters.mjs` mostra como os mestres saíram delas). Versionados: `icon-32`, `icon-192`, `icon-512`, `icon-maskable-192`, `icon-maskable-512`,
  `apple-touch-icon` (180×180) e `badge-96` (silhueta branca da barra de status do Android nas notificações push).

As imagens ficam em cache `lazy` no service worker; o app shell, o CSS, o JS e as fontes latinas em `prefetch`.
