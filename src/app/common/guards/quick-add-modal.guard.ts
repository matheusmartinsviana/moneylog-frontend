import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlSegment, UrlSegmentGroup, UrlTree } from '@angular/router';

export const quickAddModalGuard: CanActivateFn = (route) => {
  if (route.pathFromRoot.some((r) => r.outlet === 'modal')) return true;
  const router = inject(Router);
  const navigation = router.getCurrentNavigation();
  const previous = navigation?.previousNavigation?.finalUrl;
  const origin = previous
    ? router.parseUrl(previous.toString()).root.children['primary']
    : undefined;
  const modal = new UrlSegmentGroup([new UrlSegment('quick-add', {})], {});
  const root = new UrlSegmentGroup([], origin ? { primary: origin, modal } : { modal });
  return new UrlTree(root, navigation?.extractedUrl.queryParams ?? {}, null);
};
