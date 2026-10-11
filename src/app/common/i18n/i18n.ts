export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'pt';

export const HTML_LANG: Readonly<Record<Language, string>> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

export interface EmptyStateCopy {
  readonly title: string;
  readonly description: string;
}

export abstract class AppI18n {
  abstract readonly shell: {
    readonly brand: string;
    readonly skipToContent: string;
    readonly aiOn: string;
    readonly aiOff: string;
    readonly primaryNavigation: string;
    readonly bottomNavigation: string;
    readonly transactionsShort: string;
    readonly sidebarExpand: string;
    readonly sidebarCollapse: string;
  };

  abstract readonly pwa: {
    readonly offlineTitle: string;
    readonly offlineText: string;
    readonly updateTitle: string;
    readonly updateText: string;
    readonly updateAction: string;
    readonly confirmTitle: string;
    readonly confirmText: string;
    readonly confirmCancel: string;
    readonly installTitle: string;
    readonly installText: string;
    readonly installIos: string;
    readonly installAction: string;
    readonly installDismiss: string;
  };

  abstract readonly nav: {
    readonly home: string;
    readonly transactions: string;
    readonly quickAdd: string;
    readonly goals: string;
    readonly more: string;
    readonly cards: string;
    readonly accounts: string;
    readonly planning: string;
    readonly people: string;
    readonly notes: string;
    readonly import: string;
    readonly notifications: string;
    readonly insights: string;
    readonly budgets: string;
    readonly vault: string;
    readonly ai: string;
    readonly mcp: string;
    readonly settings: string;
    readonly groups: {
      readonly overview: string;
      readonly workspace: string;
      readonly system: string;
    };
  };

  abstract readonly workspacePages: {
    readonly vault: {
      readonly subtitle: string;
      readonly cardTitle: string;
      readonly lastChange: string;
      readonly noChanges: string;
      readonly foldersLabel: string;
      readonly notesTitle: string;
      readonly previewTitle: string;
      readonly selectNote: string;
      readonly metadataTitle: string;
      readonly openEditor: string;
      readonly createNote: string;
      readonly loading: string;
      readonly error: string;
      readonly retry: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly folderEmpty: string;
      readonly previewError: string;
    };
    readonly ai: {
      readonly subtitle: string;
      readonly statusTitle: string;
      readonly notConfigured: string;
      readonly notConfiguredDescription: string;
      readonly worksWithout: string;
      readonly providersTitle: string;
      readonly providersNote: string;
      readonly howTitle: string;
      readonly howIntro: string;
      readonly varProvider: string;
      readonly varKey: string;
      readonly varModel: string;
      readonly howNote: string;
      readonly privacyTitle: string;
      readonly privacyText: string;
    };
    readonly mcp: {
      readonly subtitle: string;
      readonly soon: string;
      readonly description: string;
      readonly toolsTitle: string;
      readonly planned: string;
      readonly tools: {
        readonly readTransactions: string;
        readonly analyzeSpending: string;
        readonly generateReports: string;
        readonly createPending: string;
        readonly generateNotes: string;
      };
      readonly accessTitle: string;
      readonly accessText: string;
    };
  };

  abstract readonly header: {
    readonly greeting: {
      readonly morning: string;
      readonly afternoon: string;
      readonly evening: string;
    };
    readonly theme: {
      readonly toggle: string;
      readonly toLight: string;
      readonly toDark: string;
      readonly system: string;
      readonly light: string;
      readonly dark: string;
    };
    readonly subtitle: string;
    readonly actions: {
      readonly label: string;
      readonly addExpense: string;
      readonly addIncome: string;
      readonly transfer: string;
      readonly askAi: string;
      readonly askAiHint: string;
    };
    readonly aiOff: string;
    readonly aiOn: string;
    readonly profile: { readonly label: string; readonly signOut: string };
  };

  abstract readonly charts: {
    readonly empty: string;
    readonly viewAsTable: string;
    readonly hideTable: string;
    readonly keyboardHint: string;
    readonly periodColumn: string;
    readonly other: string;
    readonly otherOne: string;
    readonly demo: string;
    readonly summary: string;
    readonly segmentedDisabled: string;
  };

  abstract readonly emptyState: {
    readonly comingSoon: string;
    readonly home: EmptyStateCopy & {
      readonly addAccount: string;
      readonly importStatement: string;
    };
    readonly transactions: EmptyStateCopy & {
      readonly addTransaction: string;
      readonly importStatement: string;
    };
    readonly goals: EmptyStateCopy & { readonly createGoal: string };
    readonly accounts: EmptyStateCopy & { readonly addAccount: string };
    readonly cards: EmptyStateCopy & { readonly addCard: string };
    readonly planning: EmptyStateCopy & { readonly addRecurrence: string };
    readonly people: EmptyStateCopy & { readonly addPerson: string };
    readonly notes: EmptyStateCopy & { readonly createNote: string; readonly importVault: string };
    readonly import: EmptyStateCopy & { readonly chooseFile: string };
    readonly insights: EmptyStateCopy & { readonly addTransaction: string };
    readonly settings: EmptyStateCopy & { readonly connectAi: string };
    readonly budgets: EmptyStateCopy;
  };

  abstract readonly home: {
    readonly asOf: string;
    readonly projection: string;
    readonly loading: string;
    readonly refreshFailed: string;
    readonly error: EmptyStateCopy & { readonly retry: string };
    readonly forbidden: EmptyStateCopy;
    readonly available: {
      readonly title: string;
      readonly description: string;
      readonly inAccounts: string;
      readonly committed30d: string;
      readonly reserved: string;
      readonly investments: string;
      readonly negative: string;
    };
    readonly committed: {
      readonly title: string;
      readonly description: string;
      readonly committedRow: string;
      readonly projectedRow: string;
      readonly projectionNote: string;
      readonly horizons: {
        readonly d7: string;
        readonly d30: string;
        readonly d60: string;
        readonly d90: string;
        readonly m6: string;
        readonly m12: string;
      };
      readonly notApplicable: string;
    };
    readonly upcoming: {
      readonly title: string;
      readonly description: string;
      readonly empty: string;
      readonly undated: string;
      readonly overdueTruncated: string;
      readonly totalOut: string;
      readonly totalIn: string;
      readonly installments: string;
      readonly due: string;
      readonly buckets: {
        readonly OVERDUE: string;
        readonly TODAY: string;
        readonly TOMORROW: string;
        readonly NEXT_7_DAYS: string;
        readonly NEXT_30_DAYS: string;
        readonly LATER: string;
      };
      readonly kinds: {
        readonly INVOICE: string;
        readonly INVOICE_FORECAST: string;
        readonly DEBT_PAYABLE: string;
        readonly DEBT_RECEIVABLE: string;
        readonly RECURRENCE: string;
        readonly SCHEDULED_TRANSACTION: string;
      };
      readonly incoming: string;
      readonly totalInNote: string;
      readonly realize: string;
      readonly realizeLabel: string;
      readonly openDebt: string;
      readonly openPending: string;
    };
    readonly month: {
      readonly title: string;
      readonly income: string;
      readonly consumption: string;
      readonly net: string;
      readonly expensesPaid: string;
      readonly methods: {
        readonly DEBIT: string;
        readonly PIX: string;
        readonly CASH: string;
        readonly BOLETO: string;
        readonly TRANSFER: string;
        readonly OTHER: string;
      };
      readonly credit: string;
      readonly refunds: string;
      readonly consumptionNote: string;
      readonly cashFlow: string;
      readonly cashIn: string;
      readonly cashOut: string;
      readonly cashNet: string;
      readonly investedNet: string;
      readonly debtConsumption: string;
      readonly lent: string;
      readonly received: string;
    };
    readonly netWorth: {
      readonly title: string;
      readonly accounts: string;
      readonly receivables: string;
      readonly cardLiabilities: string;
      readonly payables: string;
      readonly total: string;
      readonly cardFutureInstallments: string;
      readonly cardFutureInstallmentsNote: string;
    };
    readonly reservedNote: {
      readonly formula: string;
      readonly goalsLink: string;
    };
    readonly cards: {
      readonly title: string;
      readonly description: string;
      readonly loading: string;
      readonly error: string;
      readonly retry: string;
      readonly empty: string;
      readonly add: string;
      readonly open: string;
      readonly available: string;
      readonly overLimit: string;
      readonly totalCommitted: string;
      readonly committedFuture: string;
      readonly note: string;
    };
  };

  abstract readonly dashboard: {
    readonly kpis: {
      readonly label: string;
      readonly thisMonth: string;
      readonly thisMonthPartial: string;
      readonly projection: string;
      readonly inAccounts: { readonly title: string };
      readonly spending: { readonly title: string };
      readonly income: { readonly title: string };
      readonly savings: { readonly title: string; readonly noIncome: string };
      readonly delta: {
        readonly lower: string;
        readonly higher: string;
        readonly same: string;
        readonly noBase: string;
        readonly partial: string;
        readonly since: string;
        readonly points: string;
        readonly pointsPartial: string;
      };
      readonly unavailable: string;
      readonly retry: string;
      readonly loading: string;
    };
    readonly overview: {
      readonly title: string;
      readonly periodLabel: string;
      readonly basis: { readonly DATE: string; readonly COMPETENCE: string };
      readonly periods: {
        readonly D7: string;
        readonly D30: string;
        readonly M3: string;
        readonly M12: string;
      };
      readonly income: string;
      readonly expenses: string;
      readonly empty: string;
      readonly error: string;
      readonly retry: string;
      readonly loading: string;
    };
    readonly categories: {
      readonly title: string;
      readonly description: string;
      readonly total: string;
      readonly open: string;
      readonly empty: string;
      readonly error: string;
      readonly retry: string;
      readonly loading: string;
    };
  };

  abstract readonly ai: {
    readonly status: {
      readonly on: string;
      readonly providerLine: string;
      readonly remaining: string;
      readonly circuitOpen: string;
      readonly loading: string;
      readonly error: string;
      readonly retry: string;
    };
    readonly actions: {
      readonly title: string;
      readonly hint: string;
      readonly summary: string;
      readonly insights: string;
      readonly disabled: string;
    };
    readonly purposes: Readonly<Record<string, string>>;
    readonly consent: {
      readonly title: string;
      readonly intro: string;
      readonly purpose: string;
      readonly period: string;
      readonly counts: string;
      readonly countLabels: Readonly<Record<string, string>>;
      readonly tokens: string;
      readonly payload: string;
      readonly redactions: string;
      readonly redactionTypes: Readonly<Record<string, string>>;
      readonly noRedactions: string;
      readonly cancel: string;
      readonly send: string;
      readonly sending: string;
      readonly preparing: string;
      readonly redo: string;
      readonly review: string;
    };
    readonly result: {
      readonly title: string;
      readonly badge: string;
      readonly warning: string;
      readonly caveat: string;
      readonly close: string;
      readonly fallbackTitle: string;
      readonly ungrounded: string;
      readonly failed: string;
      readonly denied: string;
      readonly budget: string;
      readonly fallbackBody: string;
    };
    readonly history: {
      readonly title: string;
      readonly empty: string;
      readonly emptyHint: string;
      readonly error: string;
      readonly retry: string;
      readonly loading: string;
      readonly loadMore: string;
      readonly tokens: string;
      readonly statuses: Readonly<Record<string, string>>;
      readonly viewPayload: string;
      readonly hidePayload: string;
      readonly purged: string;
    };
    readonly insights: {
      readonly title: string;
      readonly source: string;
      readonly categoryUp: string;
      readonly categoryDown: string;
      readonly cardCommitted: string;
      readonly empty: string;
      readonly emptyHint: string;
      readonly error: string;
      readonly retry: string;
      readonly loading: string;
      readonly viewAll: string;
      readonly viewSpending: string;
    };
    readonly settings: {
      readonly title: string;
      readonly label: string;
      readonly hint: string;
      readonly saved: string;
      readonly error: string;
      readonly loading: string;
      readonly retry: string;
    };
  };

  abstract readonly search: {
    readonly label: string;
    readonly placeholder: string;
    readonly open: string;
    readonly sheetTitle: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly count: string;
    readonly countOne: string;
    readonly truncated: string;
    readonly retry: string;
    readonly archived: string;
    readonly listLabel: string;
    readonly errors: {
      readonly generic: string;
      readonly invalid: string;
      readonly rateLimit: string;
    };
    readonly groups: {
      readonly transactions: string;
      readonly accounts: string;
      readonly categories: string;
      readonly cards: string;
      readonly notes: string;
    };
  };

  abstract readonly more: {
    readonly description: string;
  };

  abstract readonly settings: {
    readonly preferences: string;
    readonly preferencesDescription: string;
    readonly language: string;
    readonly theme: string;
    readonly themeSystem: string;
    readonly themeLight: string;
    readonly themeDark: string;
    readonly languageNames: Readonly<Record<Language, string>>;
  };

  abstract readonly form: {
    readonly amountCurrency: string;
    readonly selectPlaceholder: string;
    readonly noOptions: string;
    readonly ui: {
      readonly close: string;
      readonly clear: string;
      readonly search: string;
      readonly noResults: string;
      readonly resultsCount: string;
      readonly on: string;
      readonly off: string;
    };
    readonly discard: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
      readonly stay: string;
    };
    readonly stepper: {
      readonly decrease: string;
      readonly increase: string;
    };
    readonly progress: {
      readonly warning: string;
      readonly risk: string;
    };
    readonly date: {
      readonly placeholder: string;
      readonly formatHint: string;
      readonly openCalendar: string;
      readonly chooseDate: string;
      readonly today: string;
      readonly yesterday: string;
      readonly previousMonth: string;
      readonly nextMonth: string;
      readonly previousYear: string;
      readonly nextYear: string;
      readonly chooseMonthYearNamed: string;
      readonly calendarOf: string;
      readonly chooseMonth: string;
      readonly monthPlaceholder: string;
    };
    readonly errors: {
      readonly required: string;
      readonly invalid: string;
      readonly moneyFormat: string;
      readonly moneyScale: string;
      readonly moneyNegative: string;
      readonly moneyZero: string;
      readonly dateFormat: string;
      readonly dateMin: string;
      readonly dateMax: string;
      readonly monthMin: string;
      readonly monthMax: string;
      readonly maxlength: string;
    };
    readonly dialog: {
      readonly cancel: string;
      readonly reason: string;
      readonly reasonHint: string;
    };
    readonly toast: {
      readonly dismiss: string;
    };
    readonly filePicker: {
      readonly choose: string;
      readonly change: string;
      readonly remove: string;
      readonly dropHint: string;
      readonly received: string;
      readonly tooLarge: string;
      readonly wrongType: string;
      readonly empty: string;
    };
  };

  abstract readonly auth: {
    readonly pageTitle: string;
    readonly login: {
      readonly title: string;
      readonly description: string;
      readonly email: string;
      readonly password: string;
      readonly submit: string;
      readonly submitting: string;
      readonly errors: {
        readonly invalid: string;
        readonly rateLimited: string;
        readonly network: string;
        readonly unavailable: string;
      };
      readonly statusUnavailable: string;
      readonly checking: string;
    };
    readonly setup: {
      readonly title: string;
      readonly description: string;
      readonly email: string;
      readonly code: string;
      readonly codeHint: string;
      readonly newPassword: string;
      readonly confirmPassword: string;
      readonly show: string;
      readonly hide: string;
      readonly rulesTitle: string;
      readonly ruleLength: string;
      readonly ruleBytes: string;
      readonly ruleNotEmail: string;
      readonly submit: string;
      readonly submitting: string;
      readonly retryIn: string;
      readonly errors: {
        readonly invalidCode: string;
        readonly weakPassword: string;
        readonly rateLimited: string;
        readonly validation: string;
        readonly network: string;
        readonly unavailable: string;
      };
    };
    readonly session: {
      readonly title: string;
      readonly description: string;
      readonly signOut: string;
      readonly signingOut: string;
    };
  };

  abstract readonly errors: {
    readonly network: string;
    readonly unavailable: string;
    readonly validation: string;
    readonly unprocessable: string;
    readonly load: EmptyStateCopy & { readonly retry: string };
    readonly codes: Readonly<Record<string, string>>;
  };

  abstract readonly accounts: {
    readonly uncovered: string;
    readonly tabsLabel: string;
    readonly active: string;
    readonly archivedTab: string;
    readonly add: string;
    readonly loading: string;
    readonly emptyArchived: string;
    readonly types: Readonly<Record<'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT', string>>;
    readonly columns: {
      readonly name: string;
      readonly type: string;
      readonly institution: string;
      readonly balance: string;
      readonly actions: string;
    };
    readonly negativeBalance: string;
    readonly edit: string;
    readonly archive: string;
    readonly unarchive: string;
    readonly archiveHint: string;
    readonly reservationsGoalsLink: string;
    readonly archiveConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly toast: {
      readonly created: string;
      readonly updated: string;
      readonly archived: string;
      readonly unarchived: string;
    };
    readonly form: {
      readonly createTitle: string;
      readonly editTitle: string;
      readonly name: string;
      readonly type: string;
      readonly institution: string;
      readonly optional: string;
      readonly openingBalance: string;
      readonly openingDate: string;
      readonly lockedHint: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly conflict: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
    };
  };

  abstract readonly categories: {
    readonly title: string;
    readonly description: string;
    readonly settingsLink: string;
    readonly backToSettings: string;
    readonly tabsLabel: string;
    readonly kinds: Readonly<Record<'EXPENSE' | 'INCOME', string>>;
    readonly loading: string;
    readonly empty: EmptyStateCopy;
    readonly add: string;
    readonly newName: string;
    readonly create: string;
    readonly cancel: string;
    readonly system: string;
    readonly archivedGroup: string;
    readonly rename: string;
    readonly renameLabel: string;
    readonly renameHint: string;
    readonly save: string;
    readonly archive: string;
    readonly unarchive: string;
    readonly archiveConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly toast: {
      readonly created: string;
      readonly renamed: string;
      readonly archived: string;
      readonly unarchived: string;
    };
  };

  abstract readonly transactions: {
    readonly incomeOf: string;
    readonly thirdParty: {
      readonly badge: string;
      readonly badgeFor: string;
      readonly action: string;
      readonly modal: {
        readonly title: string;
        readonly description: string;
        readonly person: string;
        readonly note: string;
        readonly save: string;
        readonly saving: string;
        readonly cancel: string;
        readonly toast: string;
      };
      readonly detail: {
        readonly title: string;
        readonly person: string;
        readonly owed: string;
        readonly received: string;
        readonly pending: string;
        readonly rule: string;
        readonly register: string;
        readonly openList: string;
      };
    };
    readonly loading: string;
    readonly voided: string;
    readonly noCategory: string;
    readonly open: string;
    readonly debtEntry: string;
    readonly openDebt: string;
    readonly views: {
      readonly label: string;
      readonly records: string;
      readonly entries: string;
    };
    readonly columns: {
      readonly date: string;
      readonly description: string;
      readonly type: string;
      readonly category: string;
      readonly account: string;
      readonly method: string;
      readonly amount: string;
      readonly competence: string;
    };
    readonly types: Readonly<
      Record<
        | 'EXPENSE'
        | 'INCOME'
        | 'TRANSFER'
        | 'INVESTMENT'
        | 'ADJUSTMENT'
        | 'REFUND'
        | 'CARD_PURCHASE'
        | 'INVOICE_PAYMENT'
        | 'LOAN_GIVEN'
        | 'MONEY_RECEIVED'
        | 'DEBT_PAYMENT',
        string
      >
    >;
    readonly methods: Readonly<
      Record<'CASH' | 'DEBIT' | 'PIX' | 'TRANSFER' | 'BOLETO' | 'OTHER', string>
    >;
    readonly directions: Readonly<
      Record<'CONTRIBUTION' | 'REDEMPTION' | 'INCREASE' | 'DECREASE', string>
    >;
    readonly filters: {
      readonly title: string;
      readonly open: string;
      readonly date: string;
      readonly from: string;
      readonly to: string;
      readonly competence: string;
      readonly lens: string;
      readonly lensConsumption: string;
      readonly lensIncome: string;
      readonly type: string;
      readonly account: string;
      readonly category: string;
      readonly method: string;
      readonly search: string;
      readonly searchPlaceholder: string;
      readonly voidedOnly: string;
      readonly allTypes: string;
      readonly allAccounts: string;
      readonly allCategories: string;
      readonly allMethods: string;
      readonly clear: string;
    };
    readonly totals: {
      readonly label: string;
      readonly count: string;
      readonly in: string;
      readonly out: string;
      readonly net: string;
      readonly netAccount: string;
      readonly total: string;
      readonly byCategory: string;
      readonly voidedNote: string;
    };
    readonly loadMore: string;
    readonly loadingMore: string;
    readonly loadMoreFailed: string;
    readonly adjustmentKinds: Readonly<Record<'CORRECTION' | 'YIELD', string>>;
    readonly detail: {
      readonly loading: string;
      readonly close: string;
      readonly back: string;
      readonly edit: string;
      readonly fields: {
        readonly date: string;
        readonly type: string;
        readonly category: string;
        readonly card: string;
        readonly invoice: string;
        readonly account: string;
        readonly accountFrom: string;
        readonly counterpartTo: string;
        readonly counterpartInvestment: string;
        readonly method: string;
        readonly direction: string;
        readonly adjustmentKind: string;
        readonly reason: string;
        readonly refundOf: string;
        readonly notes: string;
        readonly debt: string;
        readonly share: string;
        readonly recurrence: string;
        readonly recurrenceOccurrence: string;
      };
      readonly impact: {
        readonly title: string;
        readonly cash: string;
        readonly consumption: string;
        readonly netWorth: string;
        readonly commitment: string;
      };
      readonly voided: {
        readonly on: string;
        readonly reason: string;
      };
      readonly void: {
        readonly action: string;
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
        readonly reasonLabel: string;
        readonly toast: string;
        readonly blocked: Readonly<
          Record<
            | 'ACCOUNT_ARCHIVED'
            | 'HAS_ACTIVE_REFUNDS'
            | 'TRANSACTION_IN_CLOSED_INVOICE'
            | 'DEBT_HAS_SETTLEMENTS'
            | 'DEBT_CLOSED',
            string
          >
        >;
      };
      readonly installments: {
        readonly title: string;
        readonly invoice: string;
        readonly lateEntry: string;
        readonly lateEntryHint: string;
        readonly viewInvoice: string;
      };
      readonly cancel: {
        readonly action: string;
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
        readonly reasonLabel: string;
        readonly toast: string;
      };
      readonly notFound: EmptyStateCopy & { readonly back: string };
      readonly editPage: {
        readonly title: string;
        readonly notEditable: string;
        readonly toast: string;
      };
    };
  };

  abstract readonly quickAdd: {
    readonly loading: string;
    readonly modes: {
      readonly label: string;
      readonly expense: string;
      readonly pix: string;
      readonly debit: string;
      readonly income: string;
      readonly transfer: string;
      readonly credit: string;
      readonly investment: string;
      readonly adjustment: string;
      readonly refund: string;
      readonly loan: string;
      readonly received: string;
      readonly debt: string;
      readonly groups: {
        readonly spending: string;
        readonly inflow: string;
        readonly between: string;
        readonly people: string;
        readonly other: string;
      };
      readonly titles: {
        readonly expense: string;
        readonly pix: string;
        readonly debit: string;
        readonly credit: string;
        readonly income: string;
        readonly transfer: string;
        readonly investment: string;
        readonly adjustment: string;
        readonly refund: string;
        readonly loan: string;
        readonly received: string;
        readonly debt: string;
      };
    };
    readonly toast: {
      readonly saved: string;
      readonly viewTransactions: string;
      readonly viewInvoice: string;
      readonly viewDebt: string;
      readonly viewDetails: string;
      readonly newEntry: string;
    };
    readonly empty: {
      readonly noAccount: EmptyStateCopy & { readonly action: string };
      readonly needTwoAccounts: EmptyStateCopy & { readonly action: string };
      readonly noInvestmentAccount: EmptyStateCopy & { readonly action: string };
      readonly noCard: EmptyStateCopy & { readonly action: string };
    };
  };

  abstract readonly entryForm: {
    readonly pixLoanToggle: string;
    readonly amount: string;
    readonly description: string;
    readonly category: string;
    readonly account: string;
    readonly date: string;
    readonly method: string;
    readonly from: string;
    readonly to: string;
    readonly save: string;
    readonly saving: string;
    readonly retry: string;
    readonly cancel: string;
    readonly descriptionHint: string;
    readonly optionalHint: string;
    readonly incomeMonth: {
      readonly label: string;
      readonly hint: string;
      readonly next: string;
    };
    readonly noCategory: string;
    readonly investment: {
      readonly cashAccount: string;
      readonly investmentAccount: string;
      readonly direction: string;
    };
    readonly adjustment: {
      readonly direction: string;
      readonly kind: string;
      readonly reason: string;
      readonly help: string;
      readonly yieldNeedsInvestment: string;
      readonly defaultDescription: string;
    };
    readonly refund: {
      readonly original: string;
      readonly originalHint: string;
      readonly originalPlaceholder: string;
      readonly searching: string;
      readonly noResults: string;
      readonly resultsLabel: string;
      readonly remove: string;
      readonly categoryLocked: string;
      readonly defaultDescription: string;
      readonly defaultDescriptionOf: string;
      readonly target: string;
      readonly toAccount: string;
      readonly toCard: string;
      readonly card: string;
    };
  };

  abstract readonly cards: {
    readonly loading: string;
    readonly tabsLabel: string;
    readonly active: string;
    readonly archivedTab: string;
    readonly add: string;
    readonly emptyArchived: string;
    readonly columns: {
      readonly name: string;
      readonly limit: string;
      readonly invoice: string;
      readonly actions: string;
    };
    readonly limit: {
      readonly label: string;
      readonly summary: string;
      readonly overLimit: string;
      readonly overLimitSummary: string;
      readonly creditBalance: string;
      readonly notSet: string;
    };
    readonly closing: {
      readonly badge: string;
      readonly hint: string;
      readonly action: string;
      readonly modalTitle: string;
      readonly modalDescription: string;
      readonly adjust: string;
      readonly confirm: string;
      readonly confirming: string;
      readonly toast: string;
    };
    readonly noInvoice: string;
    readonly invoiceLine: string;
    readonly edit: string;
    readonly archive: string;
    readonly unarchive: string;
    readonly archiveHint: string;
    readonly archiveConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly pendingBalance: {
      readonly message: string;
      readonly link: string;
    };
    readonly toast: {
      readonly created: string;
      readonly updated: string;
      readonly archived: string;
      readonly unarchived: string;
    };
    readonly statuses: Readonly<Record<'FUTURE' | 'OPEN' | 'CLOSED' | 'OVERDUE' | 'PAID', string>>;
    readonly installmentStatuses: Readonly<
      Record<'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED', string>
    >;
    readonly form: {
      readonly createTitle: string;
      readonly editTitle: string;
      readonly name: string;
      readonly institution: string;
      readonly optional: string;
      readonly limit: string;
      readonly limitHint: string;
      readonly closingDay: string;
      readonly dueDay: string;
      readonly dayValue: string;
      readonly daysHint: string;
      readonly defaultAccount: string;
      readonly defaultAccountHint: string;
      readonly noDefaultAccount: string;
      readonly noAccounts: string;
      readonly privacy: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly conflict: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
    };
    readonly billingChange: {
      readonly title: string;
      readonly loading: string;
      readonly firstInvoice: string;
      readonly keep: string;
      readonly moved: string;
      readonly movedNone: string;
      readonly stale: string;
      readonly error: string;
      readonly waiting: string;
    };
    readonly detail: {
      readonly loading: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
      readonly limitLabel: string;
      readonly availableLabel: string;
      readonly creditBalanceLabel: string;
      readonly days: string;
      readonly committedFuture: string;
      readonly committedFutureNote: string;
      readonly totalCommittedLabel: string;
      readonly actionsLabel: string;
      readonly payInvoice: string;
      readonly newPurchase: string;
      readonly edit: string;
      readonly nothingToPay: string;
      readonly payInvoicesLoading: string;
      readonly payInvoicesError: string;
      readonly tabs: {
        readonly label: string;
        readonly invoices: string;
        readonly future: string;
      };
      readonly invoicesLoading: string;
      readonly invoicesEmpty: string;
      readonly futureLoading: string;
      readonly futureEmpty: string;
      readonly futureTotal: string;
      readonly invoiceRow: {
        readonly reference: string;
        readonly period: string;
        readonly closing: string;
        readonly due: string;
        readonly outstanding: string;
        readonly open: string;
        readonly lateEntry: string;
        readonly lateEntryHint: string;
      };
    };
    readonly invoice: {
      readonly loading: string;
      readonly heading: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
      readonly backToCard: string;
      readonly summary: {
        readonly total: string;
        readonly carryIn: string;
        readonly paid: string;
        readonly outstanding: string;
        readonly creditCarry: string;
        readonly closing: string;
        readonly due: string;
        readonly status: string;
      };
      readonly itemsTitle: string;
      readonly itemsEmpty: string;
      readonly credit: string;
      readonly lateEntry: string;
      readonly lateEntryHint: string;
      readonly columns: {
        readonly date: string;
        readonly description: string;
        readonly amount: string;
      };
      readonly openItem: string;
      readonly paymentsTitle: string;
      readonly paymentsEmpty: string;
      readonly paymentOpen: string;
      readonly overdueWarning: string;
      readonly pay: string;
      readonly payBlocked: Readonly<Record<'PAID' | 'FUTURE', string>>;
    };
    readonly pay: {
      readonly title: string;
      readonly description: string;
      readonly account: string;
      readonly amount: string;
      readonly amountHint: string;
      readonly date: string;
      readonly noAccounts: string;
      readonly addAccount: string;
      readonly scheduled: string;
      readonly preview: {
        readonly loading: string;
        readonly FULL: string;
        readonly PARTIAL: string;
        readonly OVERPAY: string;
        readonly PREPAY: string;
        readonly unavailable: string;
      };
      readonly submit: string;
      readonly submitting: string;
      readonly cancel: string;
      readonly retry: string;
      readonly toast: string;
    };
    readonly purchase: {
      readonly card: string;
      readonly amount: string;
      readonly description: string;
      readonly category: string;
      readonly date: string;
      readonly notes: string;
      readonly installments: string;
      readonly installmentsOne: string;
      readonly installmentsMany: string;
      readonly lockedHint: string;
      readonly preview: {
        readonly title: string;
        readonly loading: string;
        readonly summaryOne: string;
        readonly summaryMany: string;
        readonly list: string;
        readonly installment: string;
        readonly invoice: string;
        readonly total: string;
        readonly availableAfter: string;
        readonly unavailable: string;
        readonly warnings: {
          readonly OVER_LIMIT: string;
          readonly LATE_ENTRY: string;
          readonly LATE_ENTRY_HINT: string;
          readonly FUTURE_DATE: string;
        };
      };
    };
  };

  abstract readonly people: {
    readonly loading: string;
    readonly tabsLabel: string;
    readonly active: string;
    readonly archivedTab: string;
    readonly add: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly emptySearch: string;
    readonly emptyArchived: string;
    readonly columns: {
      readonly name: string;
      readonly balance: string;
      readonly nextDue: string;
      readonly actions: string;
    };
    readonly balance: {
      readonly RECEIVABLE: string;
      readonly PAYABLE: string;
      readonly NONE: string;
    };
    readonly openDebtsOne: string;
    readonly openDebtsMany: string;
    readonly noOpenDebts: string;
    readonly nextDue: string;
    readonly noNextDue: string;
    readonly row: {
      readonly open: string;
      readonly edit: string;
      readonly archive: string;
      readonly unarchive: string;
    };
    readonly archiveConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly toast: {
      readonly created: string;
      readonly updated: string;
      readonly archived: string;
      readonly unarchived: string;
    };
    readonly form: {
      readonly createTitle: string;
      readonly editTitle: string;
      readonly name: string;
      readonly notes: string;
      readonly optional: string;
      readonly homonym: string;
      readonly conflict: string;
      readonly reloadLatest: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
    };
    readonly picker: {
      readonly placeholder: string;
      readonly newPerson: string;
      readonly newName: string;
      readonly create: string;
      readonly creating: string;
      readonly cancelNew: string;
      readonly homonym: string;
      readonly noPeople: string;
    };
    readonly detail: {
      readonly loading: string;
      readonly actionsLabel: string;
      readonly archivedBanner: string;
      readonly archive: string;
      readonly unarchive: string;
      readonly edit: string;
      readonly lend: string;
      readonly receive: string;
      readonly newDebt: string;
      readonly tabsLabel: string;
      readonly owedToMe: string;
      readonly iOwe: string;
      readonly openSection: string;
      readonly closedSection: string;
      readonly emptyTab: string;
      readonly refreshFailed: string;
      readonly refreshRetry: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
    };
  };

  abstract readonly debts: {
    readonly status: Readonly<
      Record<'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'CANCELED' | 'VOIDED', string>
    >;
    readonly direction: Readonly<Record<'RECEIVABLE' | 'PAYABLE', string>>;
    readonly row: {
      readonly defaultTitleReceivable: string;
      readonly defaultTitlePayable: string;
      readonly principal: string;
      readonly settled: string;
      readonly outstanding: string;
      readonly expected: string;
      readonly noDate: string;
      readonly overdue: string;
      readonly open: string;
    };
    readonly detail: {
      readonly loading: string;
      readonly refreshFailed: string;
      readonly refreshRetry: string;
      readonly principal: string;
      readonly settled: string;
      readonly outstanding: string;
      readonly person: string;
      readonly creditor: string;
      readonly directionLabel: string;
      readonly date: string;
      readonly expectedDate: string;
      readonly noExpectedDate: string;
      readonly overdue: string;
      readonly description: string;
      readonly category: string;
      readonly origin: string;
      readonly originValues: Readonly<Record<'WITH_MOVEMENT' | 'WITHOUT_MOVEMENT', string>>;
      readonly viewOrigin: string;
      readonly closure: string;
      readonly closedOn: string;
      readonly closureReason: string;
      readonly settlements: {
        readonly title: string;
        readonly empty: string;
        readonly reversed: string;
        readonly view: string;
        readonly reverse: string;
        readonly reverseTitle: string;
        readonly reverseDescription: string;
        readonly reverseConfirm: string;
        readonly reverseReason: string;
        readonly reverseToast: string;
      };
      readonly actions: {
        readonly settleReceivable: string;
        readonly settlePayable: string;
        readonly forgive: string;
        readonly void: string;
        readonly edit: string;
      };
      readonly voidBlocked: Readonly<
        Record<'DEBT_HAS_SETTLEMENTS' | 'DEBT_CLOSED' | 'HAS_ORIGIN_TRANSACTION', string>
      >;
      readonly notFound: EmptyStateCopy & { readonly back: string };
    };
    readonly settle: {
      readonly titleReceivable: string;
      readonly titlePayable: string;
      readonly description: string;
      readonly account: string;
      readonly amount: string;
      readonly amountHint: string;
      readonly date: string;
      readonly note: string;
      readonly defaultDescriptionReceivable: string;
      readonly defaultDescriptionPayable: string;
      readonly submit: string;
      readonly submitting: string;
      readonly retry: string;
      readonly cancel: string;
      readonly noAccounts: string;
      readonly addAccount: string;
      readonly toastReceivable: string;
      readonly toastPayable: string;
    };
    readonly forgive: {
      readonly title: string;
      readonly description: string;
      readonly reasonLabel: string;
      readonly confirm: string;
      readonly toast: string;
    };
    readonly void: {
      readonly title: string;
      readonly description: string;
      readonly reasonLabel: string;
      readonly confirm: string;
      readonly toast: string;
    };
    readonly edit: {
      readonly title: string;
      readonly description: string;
      readonly descriptionField: string;
      readonly expectedDate: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly conflict: string;
      readonly toast: string;
    };
  };

  abstract readonly lending: {
    readonly person: string;
    readonly expectedDate: string;
    readonly expectedDateHint: string;
    readonly noPeopleLoading: string;
    readonly loan: {
      readonly help: string;
      readonly defaultDescription: string;
      readonly description: string;
      readonly toast: string;
    };
    readonly received: {
      readonly help: string;
      readonly kind: string;
      readonly repayment: string;
      readonly borrowed: string;
      readonly debt: string;
      readonly debtPlaceholder: string;
      readonly noOpenDebts: string;
      readonly debtOption: string;
      readonly amountHint: string;
      readonly defaultDescriptionRepayment: string;
      readonly defaultDescriptionBorrowed: string;
      readonly description: string;
      readonly toastRepayment: string;
      readonly toastBorrowed: string;
    };
    readonly debt: {
      readonly help: string;
      readonly noMovement: string;
      readonly direction: string;
      readonly amount: string;
      readonly date: string;
      readonly description: string;
      readonly category: string;
      readonly categoryHint: string;
      readonly categoryNone: string;
      readonly creditorLabel: string;
      readonly creditorPerson: string;
      readonly creditorOther: string;
      readonly creditorName: string;
      readonly creditorHint: string;
      readonly save: string;
      readonly toast: string;
    };
    readonly shares: {
      readonly toggle: string;
      readonly legend: string;
      readonly row: string;
      readonly person: string;
      readonly amount: string;
      readonly add: string;
      readonly remove: string;
      readonly removeUnnamed: string;
      readonly removeShort: string;
      readonly toast: string;
    };
  };

  abstract readonly recurrences: {
    readonly loading: string;
    readonly add: string;
    readonly tabsLabel: string;
    readonly tabs: {
      readonly recurrences: string;
      readonly pending: string;
      readonly summary: string;
      readonly projections: string;
      readonly debts: string;
      readonly thirdParties: string;
      readonly commitments: string;
      readonly overview: string;
    };
    readonly summary: {
      readonly title: string;
      readonly fixedCosts: string;
      readonly recurringIncome: string;
      readonly estimate: string;
      readonly note: string;
      readonly loading: string;
      readonly error: string;
      readonly retry: string;
    };
    readonly types: Readonly<Record<'EXPENSE' | 'INCOME' | 'CARD_PURCHASE', string>>;
    readonly frequency: Readonly<
      Record<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM', string>
    >;
    readonly units: Readonly<Record<'DAYS' | 'WEEKS' | 'MONTHS', string>>;
    readonly every: string;
    readonly row: {
      readonly next: string;
      readonly noNext: string;
      readonly endsOn: string;
      readonly inactive: string;
      readonly ended: string;
      readonly on: string;
      readonly monthly: string;
      readonly nextMonthIncome: string;
      readonly edit: string;
      readonly end: string;
      readonly deactivate: string;
      readonly actionsLabel: string;
      readonly accountTbd: string;
    };
    readonly endSheet: {
      readonly title: string;
      readonly description: string;
      readonly date: string;
      readonly submit: string;
      readonly submitting: string;
      readonly cancel: string;
    };
    readonly deactivateConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly toast: {
      readonly created: string;
      readonly updated: string;
      readonly ended: string;
      readonly deactivated: string;
    };
    readonly form: {
      readonly createTitle: string;
      readonly editTitle: string;
      readonly type: string;
      readonly amount: string;
      readonly description: string;
      readonly category: string;
      readonly account: string;
      readonly method: string;
      readonly card: string;
      readonly cardNote: string;
      readonly accountTbd: string;
      readonly accountTbdHint: string;
      readonly frequency: string;
      readonly interval: string;
      readonly unit: string;
      readonly intervalValue: string;
      readonly startDate: string;
      readonly endMode: string;
      readonly nextMonthIncome: string;
      readonly nextMonthIncomeHint: string;
      readonly endNone: string;
      readonly endDate: string;
      readonly endMax: string;
      readonly endDateField: string;
      readonly maxOccurrences: string;
      readonly maxValue: string;
      readonly locked: string;
      readonly endedHint: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly conflict: string;
      readonly reloadLatest: string;
      readonly notFound: EmptyStateCopy & { readonly back: string };
      readonly noAccounts: EmptyStateCopy & { readonly action: string };
    };
    readonly occurrences: {
      readonly loading: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly overdueSection: string;
      readonly overdueTruncated: string;
      readonly upcomingSection: string;
      readonly viaAccount: string;
      readonly viaCard: string;
      readonly incoming: string;
      readonly accountTbd: string;
      readonly overdue: string;
      readonly realize: string;
      readonly skip: string;
      readonly realizeLabel: string;
      readonly skipLabel: string;
      readonly skipConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly toastSkipped: string;
    };
    readonly realize: {
      readonly title: string;
      readonly description: string;
      readonly date: string;
      readonly amount: string;
      readonly amountHint: string;
      readonly account: string;
      readonly method: string;
      readonly accountNote: string;
      readonly noAccounts: string;
      readonly cardNote: string;
      readonly submit: string;
      readonly submitting: string;
      readonly retry: string;
      readonly cancel: string;
      readonly toast: string;
      readonly viewInvoice: string;
    };
  };

  abstract readonly goals: {
    readonly loading: string;
    readonly add: string;
    readonly tabsLabel: string;
    readonly tabs: {
      readonly active: string;
      readonly achieved: string;
      readonly archived: string;
    };
    readonly emptyAchieved: string;
    readonly emptyArchived: string;
    readonly addSmart: string;
    readonly metricTag: string;
    readonly metric: Readonly<
      Record<
        | 'TOTAL_DEBT'
        | 'CARD_DEBT'
        | 'PEOPLE_DEBT'
        | 'OTHER_DEBT'
        | 'ACCOUNTS_BALANCE'
        | 'AVAILABLE_BALANCE'
        | 'FIXED_COSTS_MONTHLY',
        string
      >
    >;
    readonly metricFallback: string;
    readonly generatedName: string;
    readonly archivedMetric: string;
    readonly direction: Readonly<Record<'DECREASE' | 'INCREASE', string>>;
    readonly stage: Readonly<
      Record<'FANTASY' | 'OBJECTIVE' | 'STRATEGY' | 'CONSISTENT' | 'ACHIEVED', string>
    >;
    readonly stageDescription: Readonly<
      Record<'FANTASY' | 'OBJECTIVE' | 'STRATEGY' | 'CONSISTENT' | 'ACHIEVED', string>
    >;
    readonly stageHint: Readonly<
      Record<'FANTASY' | 'OBJECTIVE' | 'STRATEGY' | 'CONSISTENT' | 'ACHIEVED', string>
    >;
    readonly stageBadge: string;
    readonly ladder: {
      readonly title: string;
      readonly intro: string;
      readonly here: string;
      readonly done: string;
      readonly todo: string;
      readonly next: string;
    };
    readonly smart: {
      readonly createTitle: string;
      readonly intro: string;
      readonly metric: string;
      readonly metricPlaceholder: string;
      readonly currentLabel: string;
      readonly currentLoading: string;
      readonly currentError: string;
      readonly retry: string;
      readonly target: string;
      readonly targetHint: string;
      readonly deadline: string;
      readonly noDeadlineWarning: string;
      readonly name: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
    };
    readonly metricDetail: {
      readonly currentLabel: string;
      readonly targetLabel: string;
      readonly baselineLabel: string;
      readonly remainingLabel: string;
      readonly note: string;
    };
    readonly plan: {
      readonly title: string;
      readonly suggestionTitle: string;
      readonly suggestion: string;
      readonly suggestionNote: string;
      readonly noPace: string;
      readonly overdue: string;
      readonly reachedNote: string;
      readonly monthsLeft: string;
      readonly milestone: string;
      readonly status: string;
      readonly onTrack: string;
      readonly behind: string;
      readonly noteLabel: string;
      readonly noteHint: string;
      readonly noteSave: string;
      readonly noteSaving: string;
      readonly actionsTitle: string;
      readonly actionsHint: string;
      readonly actionsEmpty: string;
      readonly actionTitle: string;
      readonly actionFrequency: string;
      readonly frequency: {
        readonly MONTHLY: string;
        readonly WEEKLY: string;
        readonly ONE_TIME: string;
      };
      readonly edit: string;
      readonly remove: string;
      readonly addAction: string;
      readonly addTitle: string;
      readonly editTitle: string;
      readonly saveAction: string;
      readonly savingAction: string;
      readonly cancel: string;
      readonly editAction: string;
      readonly removeAction: string;
      readonly limit: string;
      readonly checkIn: {
        readonly MONTHLY: string;
        readonly WEEKLY: string;
        readonly ONE_TIME: string;
      };
      readonly checkInAria: string;
      readonly doneIn: string;
      readonly noneDone: string;
      readonly period: {
        readonly week: string;
        readonly once: string;
      };
      readonly removeConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly toast: {
        readonly noteSaved: string;
        readonly added: string;
        readonly updated: string;
        readonly removed: string;
      };
    };
    readonly consistency: {
      readonly title: string;
      readonly description: string;
      readonly timelineLabel: string;
      readonly streak: string;
      readonly rate: string;
      readonly noRate: string;
      readonly expected: string;
      readonly actual: string;
      readonly met: string;
      readonly notMet: string;
      readonly noData: string;
      readonly inProgress: string;
      readonly empty: string;
      readonly note: string;
    };
    readonly status: Readonly<Record<'ACTIVE' | 'ACHIEVED' | 'ARCHIVED', string>>;
    readonly priority: Readonly<Record<'HIGH' | 'MEDIUM' | 'LOW', string>>;
    readonly priorityTag: string;
    readonly card: {
      readonly open: string;
      readonly progressLabel: string;
      readonly progressText: string;
      readonly percentLabel: string;
      readonly currentLabel: string;
      readonly remainingLabel: string;
      readonly deadline: string;
      readonly noDeadline: string;
      readonly monthlyLabel: string;
      readonly estimate: string;
      readonly estimateNote: string;
      readonly achieved: string;
    };
    readonly uncovered: { readonly title: string; readonly description: string };
    readonly detail: {
      readonly reserve: string;
      readonly release: string;
      readonly edit: string;
      readonly archive: string;
      readonly unarchive: string;
      readonly back: string;
      readonly reservations: string;
      readonly noReservations: string;
      readonly reservationTag: string;
      readonly releaseTag: string;
      readonly onAccount: string;
      readonly notMoney: string;
      readonly archivedNote: string;
      readonly achievedTitle: string;
      readonly achievedDescription: string;
      readonly notFound: {
        readonly title: string;
        readonly description: string;
        readonly back: string;
      };
    };
    readonly payoff: {
      readonly add: string;
      readonly created: string;
      readonly creating: string;
      readonly exists: string;
      readonly tag: string;
      readonly building: string;
      readonly buildingCard: string;
      readonly stepsTitle: string;
      readonly steps: string;
      readonly confirm: string;
      readonly confirming: string;
      readonly viewDebts: string;
      readonly baselineToast: string;
      readonly baselineLabel: string;
      readonly paidLabel: string;
      readonly achievedDescription: string;
      readonly remainingLabel: string;
      readonly progressNote: string;
      readonly grewTitle: string;
      readonly grewDescription: string;
      readonly reanchor: string;
      readonly reanchorConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
    };
    readonly archiveConfirm: {
      readonly title: string;
      readonly description: string;
      readonly confirm: string;
    };
    readonly form: {
      readonly nameOptional: string;
      readonly createTitle: string;
      readonly editTitle: string;
      readonly name: string;
      readonly target: string;
      readonly deadline: string;
      readonly priority: string;
      readonly description: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly conflict: string;
      readonly reloadLatest: string;
      readonly keepTyped: string;
    };
    readonly photos: {
      readonly title: string;
      readonly hint: string;
      readonly add: string;
      readonly counter: string;
      readonly counterLabel: string;
      readonly full: string;
      readonly empty: string;
      readonly editNote: string;
      readonly createNote: string;
      readonly cover: string;
      readonly makeCover: string;
      readonly moveLeft: string;
      readonly moveRight: string;
      readonly remove: string;
      readonly cancel: string;
      readonly retry: string;
      readonly retryAll: string;
      readonly waiting: string;
      readonly uploading: string;
      readonly failed: string;
      readonly alt: string;
      readonly queuedAlt: string;
      readonly moved: string;
      readonly loading: string;
      readonly unavailable: string;
      readonly reloadPhoto: string;
      readonly removeConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly rejected: {
        readonly type: string;
        readonly size: string;
        readonly empty: string;
        readonly limit: string;
      };
      readonly someFailed: string;
      readonly finish: string;
      readonly featured: {
        readonly label: string;
        readonly hint: string;
        readonly on: string;
        readonly off: string;
      };
      readonly gallery: {
        readonly label: string;
        readonly previous: string;
        readonly next: string;
        readonly thumbs: string;
        readonly show: string;
        readonly empty: string;
        readonly add: string;
      };
    };
    readonly reserve: {
      readonly reserveTitle: string;
      readonly releaseTitle: string;
      readonly description: string;
      readonly kind: string;
      readonly account: string;
      readonly amount: string;
      readonly date: string;
      readonly note: string;
      readonly submitReserve: string;
      readonly submitRelease: string;
      readonly submitting: string;
      readonly retry: string;
      readonly cancel: string;
      readonly noAccounts: string;
      readonly addAccount: string;
      readonly accountsError: string;
      readonly pickGoal: string;
    };
    readonly toast: {
      readonly created: string;
      readonly updated: string;
      readonly reserved: string;
      readonly released: string;
      readonly archived: string;
      readonly unarchived: string;
    };
  };

  abstract readonly summary: {
    readonly loading: string;
    readonly title: string;
    readonly monthPicker: string;
    readonly partial: string;
    readonly partialNote: string;
    readonly projection: string;
    readonly invalidMonth: {
      readonly title: string;
      readonly description: string;
      readonly action: string;
    };
    readonly income: string;
    readonly expenses: string;
    readonly expensesNote: string;
    readonly investments: string;
    readonly investmentsNote: string;
    readonly net: string;
    readonly savingsRate: string;
    readonly savingsRateEmpty: string;
    readonly largestCategory: string;
    readonly largestExpense: string;
    readonly installment: string;
    readonly openTransaction: string;
    readonly openDebt: string;
    readonly none: string;
    readonly card: string;
    readonly cardConsumption: string;
    readonly cardOutstanding: string;
    readonly futureInstallments: string;
    readonly futureInstallmentsNote: string;
    readonly comparison: {
      readonly title: string;
      readonly partialNote: string;
      readonly noBase: string;
      readonly up: string;
      readonly down: string;
      readonly same: string;
      readonly upNoPercent: string;
      readonly downNoPercent: string;
    };
    readonly analyzeOff: string;
  };

  abstract readonly projections: {
    readonly loading: string;
    readonly horizonLabel: string;
    readonly horizons: Readonly<Record<'D30' | 'D90' | 'M6' | 'M12', string>>;
    readonly bannerTitle: string;
    readonly bannerText: string;
    readonly assumptionsTitle: string;
    readonly assumptions: Readonly<Record<string, string>>;
    readonly assumptionUnknown: string;
    readonly startingBalance: string;
    readonly chartLabel: string;
    readonly table: {
      readonly caption: string;
      readonly month: string;
      readonly inflows: string;
      readonly outflows: string;
      readonly balance: string;
      readonly partialUntil: string;
    };
    readonly trend: {
      readonly toggle: string;
      readonly hint: string;
      readonly title: string;
      readonly estimate: string;
      readonly monthlyAverage: string;
      readonly basedOn: string;
      readonly spending: string;
      readonly balance: string;
      readonly unavailable: string;
      readonly reasons: Readonly<Record<string, string>>;
    };
    readonly goals: { readonly title: string; readonly note: string; readonly reserved: string };
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly action: string;
    };
  };

  abstract readonly exports: {
    readonly title: string;
    readonly description: string;
    readonly csv: {
      readonly title: string;
      readonly description: string;
      readonly from: string;
      readonly to: string;
      readonly rangeHint: string;
      readonly rangeInvalid: string;
      readonly action: string;
      readonly running: string;
      readonly headerFallback: string;
    };
    readonly backup: {
      readonly title: string;
      readonly description: string;
      readonly privacy: string;
      readonly action: string;
      readonly running: string;
    };
    readonly saved: string;
    readonly shared: string;
    readonly ready: {
      readonly title: string;
      readonly hint: string;
      readonly save: string;
      readonly dismiss: string;
    };
    readonly share: string;
    readonly retryIn: string;
    readonly retry: string;
  };

  abstract readonly notes: {
    readonly storage: string;
    readonly editorStorage: string;
    readonly list: {
      readonly loading: string;
      readonly newNote: string;
      readonly searchLabel: string;
      readonly searchPlaceholder: string;
      readonly viewLabel: string;
      readonly viewNotes: string;
      readonly viewTrash: string;
      readonly tagsLabel: string;
      readonly foldersLabel: string;
      readonly treeLabel: string;
      readonly treePartial: string;
      readonly treeLoadMore: string;
      readonly treeCapped: string;
      readonly allNotes: string;
      readonly folderSelectLabel: string;
      readonly folderItem: string;
      readonly clearFilters: string;
      readonly noResults: EmptyStateCopy;
      readonly loadMore: string;
      readonly loadingMore: string;
      readonly updated: string;
      readonly resultsCount: string;
      readonly resultsNone: string;
    };
    readonly trash: {
      readonly title: string;
      readonly description: string;
      readonly empty: string;
      readonly restore: string;
      readonly restoreNamed: string;
      readonly emptyTrash: string;
      readonly emptyConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly restored: string;
      readonly emptied: string;
      readonly trashedAt: string;
    };
    readonly create: {
      readonly title: string;
      readonly description: string;
      readonly nameLabel: string;
      readonly nameHint: string;
      readonly folderLabel: string;
      readonly folderHint: string;
      readonly submit: string;
      readonly submitting: string;
      readonly cancel: string;
      readonly nameRequired: string;
      readonly pathInvalid: string;
      readonly pathTooLong: string;
      readonly pathTooDeep: string;
      readonly suggestion: string;
      readonly created: string;
    };
    readonly editor: {
      readonly back: string;
      readonly loading: string;
      readonly notFound: {
        readonly title: string;
        readonly description: string;
        readonly back: string;
      };
      readonly modeLabel: string;
      readonly write: string;
      readonly read: string;
      readonly textLabel: string;
      readonly keyboardHelp: string;
      readonly save: string;
      readonly saving: string;
      readonly saved: string;
      readonly unsaved: string;
      readonly savedToast: string;
      readonly draftRecovered: string;
      readonly draftDiscard: string;
      readonly size: string;
      readonly tooLarge: string;
      readonly toolbarLabel: string;
      readonly bold: string;
      readonly italic: string;
      readonly linkTool: string;
      readonly wikilinkTool: string;
      readonly listTool: string;
      readonly quoteTool: string;
      readonly codeTool: string;
      readonly previewLabel: string;
      readonly previewEmpty: string;
      readonly tagsLabel: string;
      readonly tagsEmpty: string;
      readonly updated: string;
      readonly moreActions: string;
      readonly rename: string;
      readonly moveToTrash: string;
      readonly leave: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
        readonly stay: string;
      };
      readonly trashed: string;
      readonly restore: string;
      readonly trashConfirm: {
        readonly title: string;
        readonly description: string;
        readonly dirty: string;
        readonly confirm: string;
      };
      readonly trashedToast: string;
      readonly restoredToast: string;
      readonly move: {
        readonly title: string;
        readonly description: string;
        readonly pathLabel: string;
        readonly pathHint: string;
        readonly saveFirst: string;
        readonly submit: string;
        readonly submitting: string;
        readonly cancel: string;
        readonly pathInvalid: string;
        readonly moved: string;
        readonly rewrittenNone: string;
        readonly rewrittenOne: string;
        readonly rewrittenMany: string;
        readonly dismiss: string;
      };
      readonly conflict: {
        readonly title: string;
        readonly description: string;
        readonly descriptionMove: string;
        readonly descriptionLinks: string;
        readonly viewDiff: string;
        readonly hideDiff: string;
        readonly keepMine: string;
        readonly useRemote: string;
        readonly diffLabel: string;
        readonly diffAdded: string;
        readonly diffRemoved: string;
        readonly diffSame: string;
        readonly diffTooBig: string;
        readonly diffShowMore: string;
        readonly diffCount: string;
        readonly remoteVersion: string;
        readonly remoteLoadFailed: string;
      };
    };
    readonly links: {
      readonly title: string;
      readonly linkedTo: string;
      readonly none: string;
      readonly add: string;
      readonly remove: string;
      readonly removeNamed: string;
      readonly open: string;
      readonly pending: string;
      readonly pendingHint: string;
      readonly createNote: string;
      readonly types: Readonly<
        Record<
          | 'TRANSACTION'
          | 'ACCOUNT'
          | 'CARD'
          | 'INVOICE'
          | 'PERSON'
          | 'DEBT'
          | 'GOAL'
          | 'MONTHLY_SUMMARY'
          | 'NOTE',
          string
        >
      >;
      readonly status: Readonly<Record<'VOIDED' | 'ARCHIVED' | 'CANCELED' | 'TRASHED', string>>;
      readonly inText: string;
      readonly inTextNone: string;
      readonly backlinks: string;
      readonly backlinksNone: string;
      readonly backlinksError: string;
      readonly backlinksRetry: string;
      readonly saved: string;
      readonly pendingDropHint: string;
    };
    readonly picker: {
      readonly title: string;
      readonly description: string;
      readonly typeLabel: string;
      readonly searchLabel: string;
      readonly searchPlaceholder: string;
      readonly monthLabel: string;
      readonly cardLabel: string;
      readonly resultsLabel: string;
      readonly loading: string;
      readonly noResults: string;
      readonly error: string;
      readonly retry: string;
      readonly resultsCount: string;
      readonly add: string;
      readonly cancel: string;
      readonly alreadyLinked: string;
      readonly chooseCardFirst: string;
      readonly noInvoices: string;
      readonly invoiceLabel: string;
    };
    readonly linked: {
      readonly title: string;
      readonly monthlyTitle: string;
      readonly loading: string;
      readonly empty: string;
      readonly newNote: string;
      readonly loadMore: string;
      readonly createTitle: string;
      readonly createDescription: string;
      readonly note: string;
    };
    readonly vault: {
      readonly title: string;
      readonly description: string;
      readonly export: {
        readonly title: string;
        readonly description: string;
        readonly action: string;
        readonly running: string;
        readonly ready: string;
        readonly saved: string;
        readonly retry: string;
        readonly retryIn: string;
      };
      readonly import: {
        readonly title: string;
        readonly description: string;
        readonly fileLabel: string;
        readonly fileHint: string;
        readonly modeLabel: string;
        readonly skip: string;
        readonly skipHint: string;
        readonly rename: string;
        readonly renameHint: string;
        readonly action: string;
        readonly running: string;
        readonly retry: string;
        readonly uncertain: string;
        readonly reset: string;
        readonly confirm: {
          readonly title: string;
          readonly skip: string;
          readonly rename: string;
          readonly confirm: string;
        };
      };
      readonly report: {
        readonly title: string;
        readonly review: string;
        readonly created: string;
        readonly skipped: string;
        readonly pending: string;
        readonly ignored: string;
        readonly renamed: string;
        readonly warnings: string;
        readonly skippedFiles: string;
        readonly ignoredFiles: string;
        readonly renamedFiles: string;
        readonly renamedItem: string;
        readonly warningOther: string;
        readonly warningCodes: Readonly<Record<string, string>>;
        readonly done: string;
        readonly openNotes: string;
        readonly more: string;
      };
    };
    readonly markdown: {
      readonly imageBlocked: string;
      readonly imageBlockedNoAlt: string;
      readonly wikilinkPending: string;
      readonly wikilinkPendingHint: string;
      readonly embedNote: string;
      readonly externalLink: string;
      readonly taskDone: string;
      readonly taskOpen: string;
      readonly truncated: string;
      readonly tooComplex: string;
    };
  };

  abstract readonly imports: {
    readonly intro: string;
    readonly formats: string;
    readonly unsupported: string;
    readonly privacy: string;
    readonly newImport: string;
    readonly upload: {
      readonly title: string;
      readonly sourceKind: string;
      readonly kindAccount: string;
      readonly kindCard: string;
      readonly account: string;
      readonly card: string;
      readonly noAccounts: string;
      readonly noCards: string;
      readonly file: string;
      readonly fileHint: string;
      readonly send: string;
      readonly sending: string;
      readonly progress: string;
      readonly cancel: string;
      readonly cancelled: string;
      readonly retry: string;
      readonly nothingCreated: string;
      readonly chooseSource: string;
      readonly chooseFile: string;
    };
    readonly mapping: {
      readonly title: string;
      readonly description: string;
      readonly saved: string;
      readonly noPreview: string;
      readonly csvOnly: string;
      readonly useMapping: string;
      readonly columnHint: string;
      readonly date: string;
      readonly descriptionColumn: string;
      readonly valueMode: string;
      readonly oneColumn: string;
      readonly twoColumns: string;
      readonly amount: string;
      readonly debit: string;
      readonly credit: string;
      readonly invert: string;
      readonly invertHint: string;
      readonly hasHeader: string;
      readonly delimiter: string;
      readonly delimiterAuto: string;
      readonly delimiterSemicolon: string;
      readonly delimiterComma: string;
      readonly delimiterTab: string;
      readonly invalid: string;
    };
    readonly recent: {
      readonly title: string;
      readonly loading: string;
      readonly empty: string;
      readonly open: string;
      readonly lines: string;
      readonly createdOn: string;
      readonly target: string;
    };
    readonly batchStatus: Readonly<
      Record<'PENDING_REVIEW' | 'APPLIED' | 'UNDONE' | 'PARTIALLY_UNDONE', string>
    >;
    readonly lineStatus: Readonly<
      Record<'PENDING' | 'ACCEPTED' | 'DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'REJECTED', string>
    >;
    readonly flags: Readonly<
      Record<
        | 'LOOKS_LIKE_INVOICE_PAYMENT'
        | 'CARD_CREDIT_NOT_IMPORTED'
        | 'LOOKS_LIKE_INSTALLMENT'
        | 'POSSIBLE_TRANSFER',
        string
      >
    >;
    readonly flagHelp: Readonly<
      Record<
        | 'LOOKS_LIKE_INVOICE_PAYMENT'
        | 'CARD_CREDIT_NOT_IMPORTED'
        | 'LOOKS_LIKE_INSTALLMENT'
        | 'POSSIBLE_TRANSFER',
        string
      >
    >;
    readonly warnings: {
      readonly SAME_FILE_ALREADY_IMPORTED: string;
      readonly STATEMENT_KIND_MISMATCH: string;
      readonly other: string;
      readonly seeImports: string;
    };
    readonly review: {
      readonly title: string;
      readonly reviewFirst: string;
      readonly loading: string;
      readonly empty: string;
      readonly notFound: string;
      readonly back: string;
      readonly tableLabel: string;
      readonly date: string;
      readonly description: string;
      readonly amount: string;
      readonly category: string;
      readonly method: string;
      readonly status: string;
      readonly actions: string;
      readonly in: string;
      readonly out: string;
      readonly noCategory: string;
      readonly confidenceHigh: string;
      readonly confidenceMedium: string;
      readonly suggested: string;
      readonly filterStatus: string;
      readonly filterFlag: string;
      readonly allStatuses: string;
      readonly allFlags: string;
      readonly accept: string;
      readonly reject: string;
      readonly force: string;
      readonly decide: string;
      readonly edit: string;
      readonly sameLaunch: string;
      readonly otherLaunch: string;
      readonly similar: string;
      readonly viewSimilar: string;
      readonly loadMore: string;
      readonly loadingMore: string;
      readonly summary: string;
      readonly acceptAll: string;
      readonly bulkDone: string;
      readonly bulkSkipped: string;
      readonly skipReasons: Readonly<
        Record<
          | 'LINE_NOT_FOUND'
          | 'REQUIRES_DECISION'
          | 'NOT_PENDING'
          | 'NO_CATEGORY'
          | 'INVALID_TRANSITION',
          string
        >
      >;
      readonly needsDecision: string;
      readonly apply: string;
      readonly applying: string;
      readonly applyConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly applied: string;
      readonly seeTransactions: string;
      readonly undo: string;
      readonly undoing: string;
      readonly undoConfirm: {
        readonly title: string;
        readonly description: string;
        readonly reason: string;
        readonly confirm: string;
      };
      readonly undone: string;
      readonly partiallyUndone: string;
      readonly partiallyUndoneHelp: string;
      readonly blockedTitle: string;
      readonly shortcuts: {
        readonly title: string;
        readonly move: string;
        readonly accept: string;
        readonly reject: string;
        readonly category: string;
      };
      readonly rowLabel: string;
      readonly reopen: string;
      readonly discard: string;
      readonly discarding: string;
      readonly discardConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly legConflict: {
        readonly message: string;
        readonly acceptAsIs: string;
        readonly reject: string;
      };
      readonly applyFailed: {
        readonly withLine: string;
        readonly withoutLine: string;
        readonly alreadyRecorded: string;
        readonly legAlreadyRecorded: string;
        readonly other: string;
        readonly rejectLine: string;
        readonly discardBatch: string;
      };
      readonly readonlyNote: string;
      readonly skippedLines: string;
    };
    readonly decision: {
      readonly title: string;
      readonly line: string;
      readonly transferTitle: string;
      readonly transferHelp: string;
      readonly isTransfer: string;
      readonly isEntry: string;
      readonly counterpartAccount: string;
      readonly installmentTitle: string;
      readonly installmentHelp: string;
      readonly installmentSingle: string;
      readonly installmentIgnore: string;
      readonly category: string;
      readonly method: string;
      readonly noMethod: string;
      readonly editedDescription: string;
      readonly learn: string;
      readonly learnHint: string;
      readonly confirm: string;
      readonly confirmForce: string;
      readonly cancel: string;
      readonly forceHelp: string;
      readonly categoryRequired: string;
      readonly counterpartRequired: string;
    };
  };

  abstract readonly notifications: {
    readonly popover: {
      readonly title: string;
      readonly empty: string;
      readonly error: string;
      readonly retry: string;
      readonly viewAll: string;
    };
    readonly bell: {
      readonly label: string;
      readonly one: string;
      readonly many: string;
    };
    readonly center: {
      readonly subtitle: string;
      readonly loading: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly filterStatus: string;
      readonly all: string;
      readonly unread: string;
      readonly filterKind: string;
      readonly allKinds: string;
      readonly markRead: string;
      readonly markAllRead: string;
      readonly open: string;
      readonly unreadMark: string;
      readonly loadMore: string;
      readonly offline: string;
      readonly newAnnounce: string;
      readonly settingsLink: string;
      readonly listLabel: string;
    };
    readonly kinds: Readonly<
      Record<
        | 'INVOICE_DUE'
        | 'DEBT_COLLECT'
        | 'DEBT_PAYABLE_DUE'
        | 'RECURRENCE_PENDING'
        | 'COMMITTED_NEXT_MONTH'
        | 'DAILY_SUMMARY'
        | 'REMINDER'
        | 'GOAL_DEADLINE'
        | 'GROUPED',
        string
      >
    >;
    readonly messages: Readonly<Record<string, { readonly title: string; readonly body: string }>>;
    readonly unknownMessage: { readonly title: string; readonly body: string };
    readonly daily: {
      readonly greeting: string;
      readonly greetingNamed: string;
      readonly summary: string;
      readonly goal: string;
    };
    readonly reminders: {
      readonly title: string;
      readonly add: string;
      readonly edit: string;
      readonly loading: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly done: string;
      readonly doneBadge: string;
      readonly snooze: string;
      readonly showDone: string;
      readonly on: string;
      readonly onAt: string;
      readonly form: {
        readonly addTitle: string;
        readonly editTitle: string;
        readonly title: string;
        readonly date: string;
        readonly time: string;
        readonly timeHint: string;
        readonly note: string;
        readonly save: string;
        readonly cancel: string;
        readonly timeInvalid: string;
      };
    };
    readonly settings: {
      readonly title: string;
      readonly description: string;
      readonly loading: string;
      readonly dailyTitle: string;
      readonly dailyEnabled: string;
      readonly dailyTime: string;
      readonly timeHint: string;
      readonly frequency: string;
      readonly frequencies: Readonly<Record<'DAILY' | 'ONLY_DUE' | 'OFF', string>>;
      readonly kindsTitle: string;
      readonly kindsLabels: Readonly<
        Record<
          | 'INVOICE_DUE'
          | 'DEBT_COLLECT'
          | 'DEBT_PAYABLE_DUE'
          | 'RECURRENCE_PENDING'
          | 'COMMITTED_NEXT_MONTH'
          | 'GOAL_DEADLINE',
          string
        >
      >;
      readonly quietTitle: string;
      readonly quietFrom: string;
      readonly quietTo: string;
      readonly displayName: string;
      readonly displayNameHint: string;
      readonly save: string;
      readonly saving: string;
      readonly saved: string;
      readonly timeInvalid: string;
      readonly conflict: string;
      readonly back: string;
      readonly push: {
        readonly title: string;
        readonly loading: string;
        readonly enable: string;
        readonly disable: string;
        readonly working: string;
        readonly active: string;
        readonly ready: string;
        readonly serverOff: string;
        readonly unsupported: string;
        readonly iosNeedsInstall: string;
        readonly denied: string;
        readonly error: string;
      };
    };
  };

  abstract readonly debtOverview: {
    readonly tracked: {
      readonly title: string;
      readonly description: string;
      readonly empty: string;
      readonly manage: string;
      readonly add: string;
      readonly installments: string;
      readonly balanceUnknown: string;
      readonly progress: string;
      readonly nextDue: string;
      readonly paid: string;
      readonly balance: string;
      readonly directPending: string;
      readonly scheduleTitle: string;
      readonly scheduleNote: string;
      readonly kinds: Readonly<Record<'TRACKED_THIRD_PARTY' | 'LONG_TERM_PROJECT', string>>;
    };
    readonly title: string;
    readonly description: string;
    readonly loading: string;
    readonly refreshing: string;
    readonly total: {
      readonly label: string;
      readonly asOf: string;
      readonly note: string;
    };
    readonly parts: {
      readonly cards: string;
      readonly people: string;
      readonly other: string;
    };
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly addOngoing: string;
      readonly addDebt: string;
    };
    readonly none: {
      readonly title: string;
      readonly description: string;
    };
    readonly actions: {
      readonly addOngoing: string;
      readonly addDebt: string;
    };
    readonly comparison: {
      readonly title: string;
      readonly incomeBase: string;
      readonly incomeSource: Readonly<
        Record<'RECURRING_ESTIMATE' | 'LAST_FULL_MONTH' | 'NONE', string>
      >;
      readonly debtToIncome: string;
      readonly fixedCostToIncome: string;
      readonly debtMinusInAccounts: string;
      readonly inAccounts: string;
      readonly noIncome: string;
    };
    readonly cards: {
      readonly title: string;
      readonly invoiced: string;
      readonly future: string;
      readonly otherCharges: string;
      readonly adjustment: string;
      readonly plans: string;
      readonly noPlans: string;
      readonly empty: string;
      readonly remainingText: string;
      readonly installmentText: string;
      readonly until: string;
      readonly ongoing: string;
      readonly noDescription: string;
    };
    readonly people: {
      readonly title: string;
      readonly empty: string;
      readonly expected: string;
      readonly noDate: string;
      readonly overdue: string;
    };
    readonly other: {
      readonly title: string;
      readonly empty: string;
      readonly hint: string;
    };
    readonly receivables: {
      readonly label: string;
      readonly note: string;
    };
    readonly fixedCosts: {
      readonly title: string;
      readonly estimate: string;
      readonly note: string;
      readonly link: string;
    };
    readonly schedule: {
      readonly title: string;
      readonly description: string;
      readonly horizon: string;
      readonly horizonOption: string;
      readonly chartLabel: string;
      readonly remainingLine: string;
      readonly empty: string;
      readonly dueLine: string;
      readonly chips: {
        readonly overdue: string;
        readonly undated: string;
        readonly beyond: string;
      };
      readonly payoff: Readonly<Record<'on' | 'UNDATED_DEBTS' | 'BEYOND_HORIZON', string>>;
    };
    readonly goal: {
      readonly title: string;
      readonly none: string;
      readonly create: string;
      readonly open: string;
      readonly building: string;
      readonly progress: string;
    };
    readonly ongoing: {
      readonly title: string;
      readonly description: string;
      readonly card: string;
      readonly descriptionField: string;
      readonly installmentAmount: string;
      readonly totalInstallments: string;
      readonly remainingInstallments: string;
      readonly remainingHint: string;
      readonly firstInvoiceDate: string;
      readonly firstInvoiceHint: string;
      readonly noCards: string;
      readonly addCard: string;
      readonly preview: {
        readonly title: string;
        readonly loading: string;
        readonly text: string;
        readonly note: string;
      };
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly toast: string;
    };
    readonly home: {
      readonly title: string;
      readonly open: string;
      readonly empty: string;
      readonly emptyAction: string;
      readonly loading: string;
      readonly error: string;
      readonly retry: string;
    };
  };

  abstract readonly thirdParties: {
    readonly title: string;
    readonly description: string;
    readonly loading: string;
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly action: string;
    };
    readonly total: {
      readonly title: string;
      readonly owed: string;
      readonly received: string;
      readonly pending: string;
      readonly asOf: string;
      readonly note: string;
    };
    readonly people: {
      readonly title: string;
      readonly owed: string;
      readonly received: string;
      readonly pending: string;
      readonly none: string;
      readonly noDescription: string;
      readonly expected: string;
      readonly source: Readonly<Record<'DEBT' | 'EXPENSE' | 'RECEIPT', string>>;
    };
    readonly receipts: {
      readonly register: string;
      readonly reflected: string;
      readonly remove: string;
      readonly removeLabel: string;
      readonly removeConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly toast: { readonly recorded: string; readonly removed: string };
      readonly modal: {
        readonly title: string;
        readonly description: string;
        readonly noPeople: string;
        readonly person: string;
        readonly amount: string;
        readonly date: string;
        readonly link: string;
        readonly linkHint: string;
        readonly noLink: string;
        readonly note: string;
        readonly save: string;
        readonly saving: string;
        readonly cancel: string;
      };
    };
    readonly month: {
      readonly title: string;
      readonly description: string;
      readonly picker: string;
      readonly gross: string;
      readonly refunds: string;
      readonly personalNet: string;
      readonly thirdParty: string;
      readonly reimbursed: string;
      readonly pending: string;
      readonly note: string;
    };
  };

  abstract readonly commitments: {
    readonly title: string;
    readonly description: string;
    readonly loading: string;
    readonly add: string;
    readonly kinds: Readonly<Record<'TRACKED_THIRD_PARTY' | 'LONG_TERM_PROJECT', string>>;
    readonly itemTypes: Readonly<
      Record<'DOWN_PAYMENT' | 'INSTALLMENT' | 'EXTRAORDINARY' | 'FINANCING', string>
    >;
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly action: string;
    };
    readonly row: {
      readonly counterparty: string;
      readonly installments: string;
      readonly nextDue: string;
      readonly paid: string;
      readonly balance: string;
      readonly progress: string;
      readonly balanceUnknown: string;
      readonly open: string;
    };
    readonly detail: {
      readonly back: string;
      readonly loading: string;
      readonly notFound: {
        readonly title: string;
        readonly description: string;
      };
      readonly total: string;
      readonly paid: string;
      readonly balance: string;
      readonly progress: string;
      readonly directPending: string;
      readonly financingPending: string;
      readonly financingNote: string;
      readonly installments: string;
      readonly nextDue: string;
      readonly counterparty: string;
      readonly notes: string;
      readonly trackedNote: string;
      readonly onlyTracking: string;
      readonly pendingByMonth: string;
      readonly schedule: {
        readonly title: string;
        readonly empty: string;
        readonly paidOn: string;
        readonly pending: string;
        readonly noDate: string;
        readonly due: string;
        readonly markPaid: string;
        readonly markPaidFor: string;
        readonly dialog: {
          readonly title: string;
          readonly description: string;
          readonly date: string;
          readonly confirm: string;
          readonly saving: string;
          readonly cancel: string;
        };
        readonly toast: string;
      };
      readonly progressForm: {
        readonly title: string;
        readonly installmentsPaid: string;
        readonly paidAmount: string;
        readonly nextDueDate: string;
        readonly notes: string;
        readonly save: string;
        readonly saving: string;
        readonly toast: string;
      };
    };
    readonly form: {
      readonly title: string;
      readonly kind: string;
      readonly name: string;
      readonly counterparty: string;
      readonly notes: string;
      readonly installmentsTotal: string;
      readonly installmentsPaid: string;
      readonly paidAmount: string;
      readonly nextDueDate: string;
      readonly trackedNote: string;
      readonly schedule: {
        readonly title: string;
        readonly hint: string;
        readonly empty: string;
        readonly add: string;
        readonly item: string;
        readonly remove: string;
        readonly label: string;
        readonly type: string;
        readonly dueDate: string;
        readonly amount: string;
        readonly paid: string;
        readonly paidOn: string;
      };
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly toast: string;
    };
  };

  abstract readonly brief: {
    readonly register: string;
    readonly registerMore: string;
    readonly result: string;
    readonly resultCaption: string;
    readonly savings: string;
    readonly upcoming: {
      readonly title: string;
      readonly empty: string;
      readonly viewAll: string;
    };
    readonly featuredGoal: {
      readonly title: string;
      readonly empty: string;
      readonly choose: string;
      readonly open: string;
      readonly price: string;
      readonly photosLabel: string;
      readonly previous: string;
      readonly next: string;
      readonly pause: string;
      readonly play: string;
      readonly indicators: string;
      readonly goTo: string;
    };
    readonly viewTransactions: string;
    readonly panorama: {
      readonly description: string;
    };
    readonly settingsLinks: string;
    readonly more: string;
  };

  abstract readonly notFound: EmptyStateCopy & {
    readonly pageTitle: string;
    readonly goHome: string;
  };
}
