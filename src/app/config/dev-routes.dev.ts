import type { Routes } from '@angular/router';

export const devRoutes: Routes = [
  {
    path: 'dev/ui-kit',
    loadChildren: () => import('~/app/features/dev/ui-kit/ui-kit.routes'),
  },
];
