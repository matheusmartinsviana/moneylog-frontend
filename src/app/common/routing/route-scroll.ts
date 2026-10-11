import { DOCUMENT } from '@angular/common';
import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

import { isModalOnSamePage } from '~/app/common/routing/modal-route';

/**
 * Rolagem entre páginas, no lugar do `scrollPositionRestoration: 'top'` do roteador (que também voltava ao topo ao
 * abrir e fechar um modal por rota, jogando a página de trás para cima):
 * - navegação nova: volta ao topo;
 * - voltar/avançar do navegador: restaura a posição que a página tinha ao sair;
 * - abrir/fechar modal sobre a mesma página: não mexe na rolagem.
 */
export function provideRouteScroll(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const router = inject(Router);
    const view = inject(DOCUMENT).defaultView;
    if (!view) return;
    const saved = new Map<string, number>();
    let fromRoot = router.routerState.snapshot.root;
    let fromKey = router.url;
    let restoring = false;

    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        saved.set(fromKey, view.scrollY);
        fromRoot = router.routerState.snapshot.root;
        restoring = event.navigationTrigger === 'popstate';
      } else if (event instanceof NavigationEnd) {
        const toRoot = router.routerState.snapshot.root;
        fromKey = event.urlAfterRedirects;
        if (isModalOnSamePage(fromRoot, toRoot)) return;
        view.scrollTo(0, restoring ? (saved.get(event.urlAfterRedirects) ?? 0) : 0);
      }
    });
  });
}
