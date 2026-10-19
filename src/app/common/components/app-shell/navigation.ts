import { IsActiveMatchOptions } from '@angular/router';

import type { IconName } from '~/app/common/components/icon/icons';
import type { AppI18n } from '~/app/common/i18n/i18n';

export type NavKey = Exclude<keyof AppI18n['nav'], 'groups'>;

export interface NavItem {
  readonly key: NavKey;
  readonly path: string;
  readonly icon: IconName;
  readonly activeOptions: IsActiveMatchOptions | { exact: boolean };
  readonly ownerOnly?: true;
}

const PREFIX = { exact: false } as const;

const ITEMS = {
  home: { key: 'home', path: '/', icon: 'home', activeOptions: { exact: true } },
  transactions: {
    key: 'transactions',
    path: '/transactions',
    icon: 'transactions',
    activeOptions: PREFIX,
  },
  quickAdd: { key: 'quickAdd', path: '/quick-add', icon: 'plus', activeOptions: PREFIX },
  goals: { key: 'goals', path: '/goals', icon: 'goals', activeOptions: PREFIX },
  more: { key: 'more', path: '/more', icon: 'more', activeOptions: PREFIX },
  cards: { key: 'cards', path: '/cards', icon: 'cards', activeOptions: PREFIX },
  accounts: { key: 'accounts', path: '/accounts', icon: 'accounts', activeOptions: PREFIX },
  planning: { key: 'planning', path: '/planning', icon: 'planning', activeOptions: PREFIX },
  statement: { key: 'statement', path: '/statement', icon: 'chart', activeOptions: PREFIX },
  simulator: { key: 'simulator', path: '/simulator', icon: 'adjust', activeOptions: PREFIX },
  people: { key: 'people', path: '/people', icon: 'people', activeOptions: PREFIX },
  notes: { key: 'notes', path: '/notes', icon: 'notes', activeOptions: PREFIX },
  import: { key: 'import', path: '/import', icon: 'import', activeOptions: PREFIX },
  notifications: {
    key: 'notifications',
    path: '/notifications',
    icon: 'bell',
    activeOptions: PREFIX,
  },
  insights: { key: 'insights', path: '/insights', icon: 'insights', activeOptions: PREFIX },
  budgets: { key: 'budgets', path: '/budgets', icon: 'budgets', activeOptions: PREFIX },
  vault: { key: 'vault', path: '/vault', icon: 'folder', activeOptions: PREFIX },
  ai: { key: 'ai', path: '/ai', icon: 'sparkle', activeOptions: PREFIX, ownerOnly: true },
  mcp: { key: 'mcp', path: '/mcp', icon: 'link', activeOptions: PREFIX, ownerOnly: true },
  settings: { key: 'settings', path: '/settings', icon: 'settings', activeOptions: PREFIX },
} as const satisfies Record<NavKey, NavItem>;

export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  ITEMS.home,
  ITEMS.transactions,
  ITEMS.budgets,
  ITEMS.goals,
  ITEMS.settings,
];

export type BottomNavKey = keyof AppI18n['shell']['bottomNavLabels'];

export type NavGroupKey = keyof AppI18n['nav']['groups'];

export interface NavGroup {
  readonly key: NavGroupKey;
  readonly items: readonly NavItem[];
}

export const SIDEBAR_GROUPS: readonly NavGroup[] = [
  {
    key: 'overview',
    items: [
      ITEMS.home,
      ITEMS.transactions,
      ITEMS.accounts,
      ITEMS.cards,
      ITEMS.goals,
      ITEMS.budgets,
      ITEMS.planning,
      ITEMS.statement,
      ITEMS.simulator,
    ],
  },
  {
    key: 'workspace',
    items: [ITEMS.vault, ITEMS.notes, ITEMS.people, ITEMS.insights, ITEMS.ai, ITEMS.mcp],
  },
  { key: 'system', items: [ITEMS.import, ITEMS.notifications, ITEMS.settings] },
];

export const SIDEBAR_ITEMS: readonly NavItem[] = SIDEBAR_GROUPS.flatMap((group) => group.items);

export const MORE_ITEMS: readonly NavItem[] = SIDEBAR_ITEMS.filter(
  (item) => !BOTTOM_NAV_ITEMS.some((bottom) => bottom.key === item.key),
);

export const MORE_GROUPS: readonly NavGroup[] = SIDEBAR_GROUPS.map((group) => ({
  key: group.key,
  items: group.items.filter((item) => MORE_ITEMS.includes(item)),
})).filter((group) => group.items.length > 0);

export const QUICK_ADD_ITEM: NavItem = ITEMS.quickAdd;

export const SIDEBAR_MAIN_ITEMS: readonly NavItem[] = [
  ITEMS.home,
  ITEMS.transactions,
  ITEMS.accounts,
  ITEMS.cards,
  ITEMS.goals,
  ITEMS.budgets,
  ITEMS.planning,
  ITEMS.statement,
  ITEMS.simulator,
];
export const SIDEBAR_MORE_ITEM: NavItem = ITEMS.more;
export const SIDEBAR_SETTINGS_ITEM: NavItem = ITEMS.settings;

export const SIDEBAR_POPOVER_ITEMS: readonly NavItem[] = SIDEBAR_ITEMS.filter(
  (item) => !SIDEBAR_MAIN_ITEMS.includes(item) && item.key !== SIDEBAR_SETTINGS_ITEM.key,
);

export function isNavActive(item: NavItem, url: string): boolean {
  const path = url.split(/[?#]/)[0] ?? '';
  if (item.path === '/') return path === '/';
  return path === item.path || path.startsWith(`${item.path}/`);
}

export function visibleItems(items: readonly NavItem[], isOwner: boolean): readonly NavItem[] {
  return items.filter((item) => isOwner || !item.ownerOnly);
}

export function visibleGroups(groups: readonly NavGroup[], isOwner: boolean): readonly NavGroup[] {
  return groups
    .map((group) => ({ key: group.key, items: visibleItems(group.items, isOwner) }))
    .filter((group) => group.items.length > 0);
}
