import { Routes } from '@angular/router';

import { MODAL_ROUTE } from '~/app/common/routing/modal-route';
import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { CardCashOutPage } from '~/app/features/cards/pages/card-cash-out.page';
import { CardFormPage } from '~/app/features/cards/pages/card-form.page';
import { CardPage } from '~/app/features/cards/pages/card.page';
import { CardsPage } from '~/app/features/cards/pages/cards.page';
import { InvoicePage } from '~/app/features/cards/pages/invoice.page';
import { CARD_DETAIL_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    component: CardsPage,
    title: pageTitle('cards'),
    children: [{ path: 'new', component: CardFormPage, data: MODAL_ROUTE }],
  },
  {
    path: 'invoices/:invoiceId',
    providers: CARD_DETAIL_PROVIDERS,
    component: InvoicePage,
    title: pageTitle('cards'),
  },
  {
    path: ':id',
    providers: CARD_DETAIL_PROVIDERS,
    component: CardPage,
    title: pageTitle('cards'),
    children: [
      { path: 'edit', component: CardFormPage, data: MODAL_ROUTE },
      { path: 'cash-out', component: CardCashOutPage, data: MODAL_ROUTE },
    ],
  },
  {
    path: ':id/invoices/:invoiceId',
    providers: CARD_DETAIL_PROVIDERS,
    component: InvoicePage,
    title: pageTitle('cards'),
  },
];

export default routes;
