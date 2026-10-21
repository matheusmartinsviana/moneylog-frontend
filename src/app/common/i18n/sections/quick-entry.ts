export interface QuickEntryCopy {
  readonly pageTitle: string;
  readonly settingsLink: string;
  readonly description: string;
  readonly backToSettings: string;
  readonly loading: string;
  readonly cancel: string;
  readonly forbidden: { readonly title: string; readonly description: string };
  readonly generate: {
    readonly heading: string;
    readonly labelLabel: string;
    readonly labelHint: string;
    readonly accountLabel: string;
    readonly accountHint: string;
    readonly validityLabel: string;
    readonly validityOptions: Readonly<Record<'7' | '30' | '60' | '90', string>>;
    readonly submit: string;
    readonly submitting: string;
    readonly accountsLoading: string;
    readonly noAccountsTitle: string;
    readonly noAccountsDescription: string;
    readonly noAccountsAction: string;
  };
  readonly list: {
    readonly heading: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    readonly emptyAction: string;
    readonly rowActions: string;
    readonly statuses: Readonly<Record<'ACTIVE' | 'EXPIRED' | 'REVOKED', string>>;
    readonly account: string;
    readonly prefix: string;
    readonly createdAt: string;
    readonly expiresAt: string;
    readonly expiredAt: string;
    readonly revokedAt: string;
    readonly revokedByAccess: string;
    readonly lastUsed: string;
    readonly lastUsedIp: string;
    readonly lastUsedAgent: string;
    readonly neverUsed: string;
    readonly rename: string;
    readonly revoke: string;
  };
  readonly secret: {
    readonly title: string;
    readonly description: string;
    readonly warning: string;
    readonly tokenLabel: string;
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly close: string;
  };
  readonly rename: {
    readonly title: string;
    readonly labelLabel: string;
    readonly save: string;
    readonly saving: string;
  };
  readonly revokeConfirm: {
    readonly title: string;
    readonly description: string;
    readonly confirm: string;
  };
  readonly toast: {
    readonly created: string;
    readonly renamed: string;
    readonly revoked: string;
  };
}

export const quickEntryPt: QuickEntryCopy = {
  pageTitle: 'Atalhos',
  settingsLink: 'Atalhos',
  description:
    'Gere um token para registrar gastos e entradas pelo app de atalhos do iPhone, sem abrir o Monelog. Cada token serve a uma conta e só cria lançamentos.',
  backToSettings: 'Voltar aos ajustes',
  loading: 'Carregando seus tokens…',
  cancel: 'Cancelar',
  forbidden: {
    title: 'Você não tem acesso a esta página',
    description: 'Entre com uma conta ativa para gerenciar seus tokens.',
  },
  generate: {
    heading: 'Gerar token',
    labelLabel: 'Nome do token',
    labelHint: 'Por exemplo, o aparelho que vai usá-lo.',
    accountLabel: 'Conta dos lançamentos',
    accountHint: 'Tudo que o atalho registrar cai nesta conta.',
    validityLabel: 'Validade',
    validityOptions: {
      '7': '7 dias',
      '30': '30 dias (padrão)',
      '60': '60 dias',
      '90': '90 dias (máximo)',
    },
    submit: 'Gerar token',
    submitting: 'Gerando…',
    accountsLoading: 'Carregando suas contas…',
    noAccountsTitle: 'Nenhuma conta disponível para o atalho',
    noAccountsDescription:
      'O atalho precisa de uma conta corrente, poupança ou carteira ativa. Cadastre uma e volte aqui.',
    noAccountsAction: 'Ver contas',
  },
  list: {
    heading: 'Seus tokens',
    emptyTitle: 'Nenhum token.',
    emptyDescription: 'Gere um para usar o atalho.',
    emptyAction: 'Gerar token',
    rowActions: 'Ações do token {label}',
    statuses: { ACTIVE: 'Ativo', EXPIRED: 'Expirado', REVOKED: 'Revogado' },
    account: 'Conta: {account}',
    prefix: 'Começa com {prefix}',
    createdAt: 'Criado em {when}',
    expiresAt: 'Expira em {when}',
    expiredAt: 'Expirou em {when}',
    revokedAt: 'Revogado em {when}',
    revokedByAccess: 'Revogado porque o acesso da conta foi desativado.',
    lastUsed: 'Último uso em {when}',
    lastUsedIp: 'IP {ip}',
    lastUsedAgent: 'Enviado por {agent}',
    neverUsed: 'Ainda não usado',
    rename: 'Renomear',
    revoke: 'Revogar',
  },
  secret: {
    title: 'Copie o token agora',
    description: 'Cole o token no atalho antes de fechar. Ele não será exibido de novo.',
    warning:
      'Quem tem este token pode registrar lançamentos na conta escolhida. Guarde-o só no atalho; se ele vazar, revogue aqui.',
    tokenLabel: 'Token de {label}',
    copy: 'Copiar token',
    copied: 'Token copiado',
    copyFailed: 'Não foi possível copiar. Selecione o texto do token e copie manualmente.',
    close: 'Já copiei, fechar',
  },
  rename: {
    title: 'Renomear token',
    labelLabel: 'Nome do token',
    save: 'Salvar',
    saving: 'Salvando…',
  },
  revokeConfirm: {
    title: 'Revogar {label}?',
    description:
      'O atalho que usa este token para de funcionar na hora. Os lançamentos já feitos continuam; para desfazer algum, estorne pelo app.',
    confirm: 'Revogar',
  },
  toast: {
    created: 'Token gerado.',
    renamed: 'Token renomeado.',
    revoked: 'Token revogado.',
  },
};

export const quickEntryEn: QuickEntryCopy = {
  pageTitle: 'Shortcuts',
  settingsLink: 'Shortcuts',
  description:
    'Generate a token to log expenses and income from the iPhone shortcuts app, without opening Monelog. Each token serves one account and can only create entries.',
  backToSettings: 'Back to settings',
  loading: 'Loading your tokens…',
  cancel: 'Cancel',
  forbidden: {
    title: "You can't access this page",
    description: 'Sign in with an active account to manage your tokens.',
  },
  generate: {
    heading: 'Generate token',
    labelLabel: 'Token name',
    labelHint: 'For example, the device that will use it.',
    accountLabel: 'Account for the entries',
    accountHint: 'Everything the shortcut logs lands in this account.',
    validityLabel: 'Validity',
    validityOptions: {
      '7': '7 days',
      '30': '30 days (default)',
      '60': '60 days',
      '90': '90 days (maximum)',
    },
    submit: 'Generate token',
    submitting: 'Generating…',
    accountsLoading: 'Loading your accounts…',
    noAccountsTitle: 'No account available for the shortcut',
    noAccountsDescription:
      'The shortcut needs an active checking, savings or wallet account. Add one and come back.',
    noAccountsAction: 'View accounts',
  },
  list: {
    heading: 'Your tokens',
    emptyTitle: 'No tokens.',
    emptyDescription: 'Generate one to use the shortcut.',
    emptyAction: 'Generate token',
    rowActions: 'Actions for token {label}',
    statuses: { ACTIVE: 'Active', EXPIRED: 'Expired', REVOKED: 'Revoked' },
    account: 'Account: {account}',
    prefix: 'Starts with {prefix}',
    createdAt: 'Created on {when}',
    expiresAt: 'Expires on {when}',
    expiredAt: 'Expired on {when}',
    revokedAt: 'Revoked on {when}',
    revokedByAccess: 'Revoked because the account access was turned off.',
    lastUsed: 'Last used on {when}',
    lastUsedIp: 'IP {ip}',
    lastUsedAgent: 'Sent by {agent}',
    neverUsed: 'Not used yet',
    rename: 'Rename',
    revoke: 'Revoke',
  },
  secret: {
    title: 'Copy the token now',
    description: "Paste the token into the shortcut before closing. It won't be shown again.",
    warning:
      'Anyone with this token can log entries in the chosen account. Keep it only in the shortcut; if it leaks, revoke it here.',
    tokenLabel: 'Token for {label}',
    copy: 'Copy token',
    copied: 'Token copied',
    copyFailed: "Couldn't copy. Select the token text and copy it manually.",
    close: "I've copied it, close",
  },
  rename: {
    title: 'Rename token',
    labelLabel: 'Token name',
    save: 'Save',
    saving: 'Saving…',
  },
  revokeConfirm: {
    title: 'Revoke {label}?',
    description:
      'The shortcut using this token stops working right away. Entries already made stay; to undo one, reverse it in the app.',
    confirm: 'Revoke',
  },
  toast: {
    created: 'Token generated.',
    renamed: 'Token renamed.',
    revoked: 'Token revoked.',
  },
};

export const quickEntryEs: QuickEntryCopy = {
  pageTitle: 'Atajos',
  settingsLink: 'Atajos',
  description:
    'Genera un token para registrar gastos e ingresos desde la app de atajos del iPhone, sin abrir Monelog. Cada token sirve a una cuenta y solo crea movimientos.',
  backToSettings: 'Volver a los ajustes',
  loading: 'Cargando tus tokens…',
  cancel: 'Cancelar',
  forbidden: {
    title: 'No tienes acceso a esta página',
    description: 'Entra con una cuenta activa para gestionar tus tokens.',
  },
  generate: {
    heading: 'Generar token',
    labelLabel: 'Nombre del token',
    labelHint: 'Por ejemplo, el dispositivo que lo va a usar.',
    accountLabel: 'Cuenta de los movimientos',
    accountHint: 'Todo lo que registre el atajo cae en esta cuenta.',
    validityLabel: 'Validez',
    validityOptions: {
      '7': '7 días',
      '30': '30 días (por defecto)',
      '60': '60 días',
      '90': '90 días (máximo)',
    },
    submit: 'Generar token',
    submitting: 'Generando…',
    accountsLoading: 'Cargando tus cuentas…',
    noAccountsTitle: 'Ninguna cuenta disponible para el atajo',
    noAccountsDescription:
      'El atajo necesita una cuenta corriente, de ahorro o billetera activa. Crea una y vuelve aquí.',
    noAccountsAction: 'Ver cuentas',
  },
  list: {
    heading: 'Tus tokens',
    emptyTitle: 'Ningún token.',
    emptyDescription: 'Genera uno para usar el atajo.',
    emptyAction: 'Generar token',
    rowActions: 'Acciones del token {label}',
    statuses: { ACTIVE: 'Activo', EXPIRED: 'Vencido', REVOKED: 'Revocado' },
    account: 'Cuenta: {account}',
    prefix: 'Empieza con {prefix}',
    createdAt: 'Creado el {when}',
    expiresAt: 'Vence el {when}',
    expiredAt: 'Venció el {when}',
    revokedAt: 'Revocado el {when}',
    revokedByAccess: 'Revocado porque el acceso de la cuenta fue desactivado.',
    lastUsed: 'Último uso el {when}',
    lastUsedIp: 'IP {ip}',
    lastUsedAgent: 'Enviado por {agent}',
    neverUsed: 'Aún sin uso',
    rename: 'Renombrar',
    revoke: 'Revocar',
  },
  secret: {
    title: 'Copia el token ahora',
    description: 'Pega el token en el atajo antes de cerrar. No se mostrará de nuevo.',
    warning:
      'Quien tenga este token puede registrar movimientos en la cuenta elegida. Guárdalo solo en el atajo; si se filtra, revócalo aquí.',
    tokenLabel: 'Token de {label}',
    copy: 'Copiar token',
    copied: 'Token copiado',
    copyFailed: 'No se pudo copiar. Selecciona el texto del token y cópialo a mano.',
    close: 'Ya lo copié, cerrar',
  },
  rename: {
    title: 'Renombrar token',
    labelLabel: 'Nombre del token',
    save: 'Guardar',
    saving: 'Guardando…',
  },
  revokeConfirm: {
    title: '¿Revocar {label}?',
    description:
      'El atajo que usa este token deja de funcionar al instante. Los movimientos ya hechos siguen; para deshacer alguno, reviértelo en la app.',
    confirm: 'Revocar',
  },
  toast: {
    created: 'Token generado.',
    renamed: 'Token renombrado.',
    revoked: 'Token revocado.',
  },
};
