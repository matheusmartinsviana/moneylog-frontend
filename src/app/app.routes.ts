import { Routes } from '@angular/router';

import { AppShellComponent } from '~/app/common/components/app-shell/app-shell.component';
import { authGuard, guestGuard } from '~/app/common/guards/auth.guard';
import { ownerGuard } from '~/app/common/guards/role.guard';
import { devRoutes } from '~/app/config/dev-routes';

const quickAddRoutes = () => import('~/app/features/quick-add/quick-add.routes');

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    loadChildren: () => import('~/app/features/login/login.routes'),
  },
  {
    path: 'convite',
    loadChildren: () => import('~/app/features/invitation/invitation.routes'),
  },
  {
    path: '',
    component: AppShellComponent,
    canMatch: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('~/app/features/home/home.routes'),
      },
      {
        path: 'transactions',
        loadChildren: () => import('~/app/features/transactions/transactions.routes'),
      },
      { path: 'quick-add', loadChildren: quickAddRoutes },
      { path: 'quick-add', outlet: 'modal', loadChildren: quickAddRoutes },
      { path: 'goals', loadChildren: () => import('~/app/features/goals/goals.routes') },
      { path: 'more', loadChildren: () => import('~/app/features/more/more.routes') },
      { path: 'cards', loadChildren: () => import('~/app/features/cards/cards.routes') },
      { path: 'accounts', loadChildren: () => import('~/app/features/accounts/accounts.routes') },
      { path: 'planning', loadChildren: () => import('~/app/features/planning/planning.routes') },
      {
        path: 'statement',
        loadChildren: () => import('~/app/features/statement/statement.routes'),
      },
      {
        path: 'simulator',
        loadChildren: () => import('~/app/features/simulator/simulator.routes'),
      },
      { path: 'people', loadChildren: () => import('~/app/features/people/people.routes') },
      { path: 'debts', loadChildren: () => import('~/app/features/debts/debts.routes') },
      { path: 'notes', loadChildren: () => import('~/app/features/notes/notes.routes') },
      { path: 'import', loadChildren: () => import('~/app/features/import/import.routes') },
      {
        path: 'notifications',
        loadChildren: () => import('~/app/features/notifications/notifications.routes'),
      },
      { path: 'insights', loadChildren: () => import('~/app/features/insights/insights.routes') },
      { path: 'budgets', loadChildren: () => import('~/app/features/budgets/budgets.routes') },
      { path: 'vault', loadChildren: () => import('~/app/features/vault/vault.routes') },
      {
        path: 'ai',
        canMatch: [ownerGuard],
        loadChildren: () => import('~/app/features/ai/ai.routes'),
      },
      {
        path: 'mcp',
        canMatch: [ownerGuard],
        loadChildren: () => import('~/app/features/mcp/mcp.routes'),
      },
      {
        path: 'users',
        canMatch: [ownerGuard],
        loadChildren: () => import('~/app/features/users/users.routes'),
      },
      { path: 'settings', loadChildren: () => import('~/app/features/settings/settings.routes') },
      ...devRoutes,
      { path: '**', loadChildren: () => import('~/app/features/not-found/not-found.routes') },
    ],
  },
];
