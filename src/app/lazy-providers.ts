import { Provider } from '@angular/core';

import { provideAssets } from '~/modules/assets/infra/assets.providers';
import { provideCommitments } from '~/modules/commitments/infra/commitments.providers';
import { provideDashboard } from '~/modules/dashboard/infra/dashboard.providers';
import { provideDebtOverview } from '~/modules/debt-overview/infra/debt-overview.providers';
import { provideDebts } from '~/modules/debts/infra/debts.providers';
import { provideExports } from '~/modules/exports/infra/exports.providers';
import { provideGoals } from '~/modules/goals/infra/goals.providers';
import { provideImports } from '~/modules/imports/infra/imports.providers';
import { provideIncome } from '~/modules/income/infra/income.providers';
import { provideMonthlySummary } from '~/modules/monthly-summary/infra/monthly-summary.providers';
import { provideNetWorth } from '~/modules/net-worth/infra/net-worth.providers';
import { provideNotes } from '~/modules/notes/infra/notes.providers';
import { provideOwnerStatement } from '~/modules/owner-statement/infra/owner-statement.providers';
import { providePeople } from '~/modules/people/infra/people.providers';
import { provideProjections } from '~/modules/projections/infra/projections.providers';
import { providePurchaseGroups } from '~/modules/purchase-groups/infra/purchase-groups.providers';
import { provideQuickEntry } from '~/modules/quick-entry/infra/quick-entry.providers';
import { provideRecurrences } from '~/modules/recurrences/infra/recurrences.providers';
import { provideReports } from '~/modules/reports/infra/reports.providers';
import { provideSimulations } from '~/modules/simulations/infra/simulations.providers';
import { provideThirdParties } from '~/modules/third-parties/infra/third-parties.providers';
import { provideUsers } from '~/modules/users/infra/users.providers';

export const STATEMENT_PROVIDERS: Provider[] = [provideOwnerStatement()];
export const SIMULATOR_PROVIDERS: Provider[] = [provideSimulations(), provideRecurrences()];
export const USERS_PROVIDERS: Provider[] = [provideUsers()];
export const IMPORT_PROVIDERS: Provider[] = [provideImports()];
export const SETTINGS_PROVIDERS: Provider[] = [
  provideExports(),
  provideNotes(),
  provideQuickEntry(),
];
export const PLANNING_PROVIDERS: Provider[] = [
  provideRecurrences(),
  provideDashboard(),
  provideReports(),
  provideNotes(),
  provideProjections(),
  provideMonthlySummary(),
  provideDebtOverview(),
  provideThirdParties(),
  provideCommitments(),
  providePeople(),
  providePurchaseGroups(),
  provideIncome(),
  provideDebts(),
  provideNetWorth(),
  provideAssets(),
];
export const TRANSACTIONS_PROVIDERS: Provider[] = [
  provideThirdParties(),
  providePeople(),
  provideNotes(),
];
export const REPORTS_PROVIDERS: Provider[] = [provideReports()];
export const HOME_PROVIDERS: Provider[] = [
  provideDashboard(),
  ...REPORTS_PROVIDERS,
  provideMonthlySummary(),
];
export const CARD_DETAIL_PROVIDERS: Provider[] = [
  provideDebtOverview(),
  provideNotes(),
  provideDebts(),
  providePeople(),
];
export const GOALS_PROVIDERS: Provider[] = [provideGoals(), provideNotes()];
export const NOTES_PROVIDERS: Provider[] = [
  provideNotes(),
  provideGoals(),
  provideDebts(),
  providePeople(),
];
export const DEBTS_PROVIDERS: Provider[] = [provideDebts(), provideNotes()];
export const PEOPLE_PROVIDERS: Provider[] = [providePeople(), provideNotes()];
export const QUICK_ADD_PROVIDERS: Provider[] = [provideDebts(), providePeople()];
export const VAULT_PROVIDERS: Provider[] = [provideNotes()];
