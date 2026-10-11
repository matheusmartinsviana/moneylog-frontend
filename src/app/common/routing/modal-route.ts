import type { ActivatedRouteSnapshot } from '@angular/router';

export const MODAL_ROUTE = { modal: true } as const;

const MODAL_OUTLET = 'modal';

function hasModal(snapshot: ActivatedRouteSnapshot): boolean {
  if (snapshot.data?.['modal'] === true || snapshot.outlet === MODAL_OUTLET) return true;
  return snapshot.children.some(hasModal);
}

export function isModalNavigation(
  from: ActivatedRouteSnapshot,
  to: ActivatedRouteSnapshot,
): boolean {
  return hasModal(from) || hasModal(to);
}

function pageKey(snapshot: ActivatedRouteSnapshot): string {
  if (snapshot.data?.['modal'] === true || snapshot.outlet === MODAL_OUTLET) return '';
  const own = snapshot.url.map((segment) => segment.path).join('/');
  const children = snapshot.children.map(pageKey).filter((key) => key !== '');
  return [own, ...children].filter((part) => part !== '').join('/');
}

export function isModalOnSamePage(
  from: ActivatedRouteSnapshot,
  to: ActivatedRouteSnapshot,
): boolean {
  return isModalNavigation(from, to) && pageKey(from) === pageKey(to);
}
