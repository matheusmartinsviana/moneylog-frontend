/**
 * Nome do produto exibido na interface (wordmark da sidebar, título das páginas, login).
 *
 * "FinVault" do brief DS 02 é só nome de trabalho; o produto se chama **moneylog** (ADR-001, ADR-011).
 * Renomear é editar esta linha (e o `<title>`, o `manifest` e as metas de `index.html`, que são arquivos
 * estáticos e não leem TypeScript: o spec `brand.spec.ts` falha se eles divergirem desta constante).
 * O logo (arte do dono, em `brand/`) vira os ícones do PWA e das notificações por `npm run icons`.
 */
export const BRAND_NAME = 'moneylog';
