import { Routes } from '@angular/router';

import { MODAL_ROUTE } from '~/app/common/routing/modal-route';
import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { TransactionDetailPage } from '~/app/features/transactions/pages/transaction-detail.page';
import { TransactionEditPage } from '~/app/features/transactions/pages/transaction-edit.page';
import { TransactionsPage } from '~/app/features/transactions/pages/transactions.page';
import { TRANSACTIONS_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    component: TransactionsPage,
    providers: TRANSACTIONS_PROVIDERS,
    title: pageTitle('transactions'),
    children: [
      {
        path: ':id',
        component: TransactionDetailPage,
        children: [{ path: 'edit', component: TransactionEditPage, data: MODAL_ROUTE }],
      },
    ],
  },
];

export default routes;
