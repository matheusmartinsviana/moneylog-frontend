# `src/assets`

Arquivos estáticos servidos em `/assets` (os README são ignorados no build).

- `icons/*.png`: **gerados** por `npm run icons` a partir da arte do dono em `brand/` (mestres `logo-any`, `logo-maskable`,
  `logo-apple` e `logo-badge`; o PNG original está em `brand/logo-source.png` e `brand/make-masters.mjs` mostra como os
  mestres saíram dele). Versionados: `icon-32`, `icon-192`, `icon-512`, `icon-maskable-192`, `icon-maskable-512`,
  `apple-touch-icon` (180×180) e `badge-96` (silhueta branca da barra de status do Android nas notificações push).
  O logo também aparece na barra lateral e no login (`icons/icon-192.png`).

As imagens ficam em cache `lazy` no service worker; o app shell, o CSS, o JS e as fontes latinas em `prefetch`.
