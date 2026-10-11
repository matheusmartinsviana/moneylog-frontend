import type { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Marca uma rota que abre um modal por cima da página (deep link: `/accounts/new`). Abrir ou fechar
 * um modal não troca de página: a página de trás não pode piscar nem deslizar (sem view transition).
 */
export const MODAL_ROUTE = { modal: true } as const;

/** Outlet auxiliar que hospeda modais (`<origem>(modal:quick-add)`). */
const MODAL_OUTLET = 'modal';

function hasModal(snapshot: ActivatedRouteSnapshot): boolean {
  if (snapshot.data?.['modal'] === true || snapshot.outlet === MODAL_OUTLET) return true;
  return snapshot.children.some(hasModal);
}

/** A navegação abre, fecha ou troca um modal (origem ou destino têm rota de modal ativa). */
export function isModalNavigation(
  from: ActivatedRouteSnapshot,
  to: ActivatedRouteSnapshot,
): boolean {
  return hasModal(from) || hasModal(to);
}
