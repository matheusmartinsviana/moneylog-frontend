# `src/assets`

Arquivos estáticos servidos em `/assets` (os README são ignorados no build).

- `brand/logo-mark-64|128|256.webp`: só o glifo "$" (fita verde-pálida e sálvia) com fundo transparente. A sidebar e o login o colocam sobre um slot verde-floresta (`--brand-forest`) em qualquer tema.
- `icons/*`: **gerados** por `npm run icons` a partir da arte do dono em `brand/logo-source.png`: `favicon.ico`, `icon-16/32/48` (zoom no glifo, cantos arredondados transparentes), `icon-192`, `icon-512` (cantos arredondados), `icon-maskable-192/512` e `apple-touch-icon` (180, opaco; full-bleed com o glifo na safe zone) e `badge-96` (silhueta branca do glifo, barra de status do Android nas notificações push).

As imagens ficam em cache `lazy` no service worker; o app shell, o CSS, o JS e as fontes latinas em `prefetch`.

Os ícones são referenciados com `?v=N` (index.html, manifest, sw-push.js). Ao trocar a arte, aumente o N (hoje 5): o Safari e a Cloudflare guardam o ícone por horas e só buscam de novo com uma URL nova.
