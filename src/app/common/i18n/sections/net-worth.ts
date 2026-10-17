export interface NetWorthCopy {
  readonly pageTitle: string;
  readonly loading: string;
  readonly overview: {
    readonly title: string;
    readonly description: string;
    readonly cash: string;
    readonly availableAssets: string;
    readonly reservedAssets: string;
    readonly reservedTag: string;
    readonly receivables: string;
    readonly debts: string;
    readonly notDoubleCount: string;
    readonly reservedNote: string;
  };
  readonly reserve: {
    readonly title: string;
    readonly description: string;
    readonly amount: string;
    readonly monthlyBase: string;
    readonly coverage: string;
    readonly coverageValue: string;
    readonly noBase: string;
    readonly targetMonths: string;
    readonly targetHint: string;
    readonly apply: string;
    readonly clear: string;
    readonly targetAmount: string;
    readonly missing: string;
    readonly targetNote: string;
    readonly countsNote: string;
    readonly targetInvalid: string;
    readonly targetLabel: string;
  };
  readonly assets: {
    readonly title: string;
    readonly add: string;
    readonly loading: string;
    readonly statusLabel: string;
    readonly status: { readonly active: string; readonly archived: string };
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly action: string;
    };
    readonly emptyArchived: string;
    readonly kind: { readonly FGTS: string; readonly OTHER: string };
    readonly availability: { readonly RESERVED: string; readonly AVAILABLE: string };
    readonly countsAsReserve: string;
    readonly employer: string;
    readonly monthlyDeposit: string;
    readonly balanceOn: string;
    readonly archived: string;
    readonly updateBalance: string;
    readonly edit: string;
    readonly archive: string;
    readonly showHistory: string;
    readonly hideHistory: string;
    readonly actionAria: string;
    readonly history: {
      readonly title: string;
      readonly loading: string;
      readonly empty: string;
      readonly line: string;
      readonly recordedAt: string;
    };
    readonly archiveTitle: string;
    readonly archiveDescription: string;
    readonly archiveConfirm: string;
    readonly archiveToast: string;
    readonly cancel: string;
  };
  readonly form: {
    readonly title: string;
    readonly editTitle: string;
    readonly kind: string;
    readonly name: string;
    readonly employer: string;
    readonly balance: string;
    readonly balanceDate: string;
    readonly balanceNote: string;
    readonly monthlyDeposit: string;
    readonly monthlyDepositHint: string;
    readonly availability: string;
    readonly availabilityHint: string;
    readonly countsAsReserve: string;
    readonly countsHint: string;
    readonly cancel: string;
    readonly save: string;
    readonly saving: string;
    readonly toast: string;
    readonly toastUpdated: string;
  };
  readonly balanceForm: {
    readonly title: string;
    readonly description: string;
    readonly balance: string;
    readonly date: string;
    readonly cancel: string;
    readonly save: string;
    readonly saving: string;
    readonly toast: string;
  };
}

export const netWorthPt: NetWorthCopy = {
  pageTitle: 'Patrimônio',
  loading: 'Carregando o patrimônio.',
  overview: {
    title: 'Patrimônio',
    description: 'Separa o que está disponível do que não pode ser usado agora.',
    cash: 'Saldo em contas',
    availableAssets: 'Ativos disponíveis',
    reservedAssets: 'Ativos não disponíveis',
    reservedTag: 'Não disponível',
    receivables: 'A receber',
    debts: 'Dívidas',
    notDoubleCount:
      'Não cadastre como ativo um saldo que já está em uma conta, para não contar duas vezes.',
    reservedNote:
      'O FGTS e outros ativos não disponíveis ficam fora do disponível e da reserva de emergência.',
  },
  reserve: {
    title: 'Reserva de emergência',
    description: 'Quantos meses dos seus gastos fixos a reserva cobre.',
    amount: 'Reserva',
    monthlyBase: 'Gastos fixos do mês (minha parte)',
    coverage: 'Cobertura',
    coverageValue: '{months} meses',
    noBase: 'Sem gastos fixos neste mês, então a cobertura não pode ser calculada.',
    targetMonths: 'Meta de cobertura, em meses',
    targetHint: 'De 1 a 60 meses.',
    apply: 'Calcular meta',
    clear: 'Limpar meta',
    targetAmount: 'Valor da meta',
    missing: 'Falta para a meta',
    targetNote: 'A meta serve só para este cálculo e não fica salva.',
    countsNote: 'Só entram aqui os ativos disponíveis marcados como reserva. O FGTS nunca entra.',
    targetInvalid: 'Informe uma meta de 1 a 60 meses.',
    targetLabel: 'Meta de {months} meses',
  },
  assets: {
    title: 'Ativos',
    add: 'Novo ativo',
    loading: 'Carregando os ativos.',
    statusLabel: 'Situação dos ativos',
    status: { active: 'Ativos', archived: 'Arquivados' },
    empty: {
      title: 'Nenhum ativo cadastrado',
      description:
        'Cadastre o FGTS ou outro saldo que não está em uma conta para ver o patrimônio completo.',
      action: 'Novo ativo',
    },
    emptyArchived: 'Nenhum ativo arquivado.',
    kind: { FGTS: 'FGTS', OTHER: 'Outro ativo' },
    availability: { RESERVED: 'Não disponível', AVAILABLE: 'Disponível' },
    countsAsReserve: 'Conta na reserva',
    employer: 'Empregador: {name}',
    monthlyDeposit: 'Depósito mensal: {amount}',
    balanceOn: 'Saldo em {date}',
    archived: 'Arquivado',
    updateBalance: 'Atualizar saldo',
    edit: 'Editar',
    archive: 'Arquivar',
    showHistory: 'Ver histórico',
    hideHistory: 'Ocultar histórico',
    actionAria: '{action}: {name}',
    history: {
      title: 'Histórico de saldo',
      loading: 'Carregando o histórico.',
      empty: 'Nenhuma atualização de saldo.',
      line: '{amount} em {date}',
      recordedAt: 'Registrado em {date}',
    },
    archiveTitle: 'Arquivar este ativo?',
    archiveDescription:
      'O ativo sai das somas do patrimônio. Nada é apagado e o histórico de saldo permanece.',
    archiveConfirm: 'Arquivar',
    archiveToast: 'Ativo arquivado.',
    cancel: 'Cancelar',
  },
  form: {
    title: 'Novo ativo',
    editTitle: 'Editar ativo',
    kind: 'Tipo',
    name: 'Nome',
    employer: 'Empregador (opcional)',
    balance: 'Saldo',
    balanceDate: 'Data do saldo',
    balanceNote:
      'Para mudar o saldo depois, atualize-o no próprio ativo: o histórico é preservado.',
    monthlyDeposit: 'Depósito mensal esperado (opcional)',
    monthlyDepositHint: 'Só informativo: não gera lançamento.',
    availability: 'Disponibilidade',
    availabilityHint: 'O FGTS é sempre não disponível.',
    countsAsReserve: 'Conta na reserva de emergência',
    countsHint: 'Só vale para ativo disponível.',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando…',
    toast: 'Ativo criado.',
    toastUpdated: 'Ativo atualizado.',
  },
  balanceForm: {
    title: 'Atualizar saldo',
    description: 'O saldo novo entra no histórico. Não gera lançamento nem renda.',
    balance: 'Novo saldo',
    date: 'Data do saldo',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando…',
    toast: 'Saldo atualizado.',
  },
};

export const netWorthEn: NetWorthCopy = {
  pageTitle: 'Net worth',
  loading: 'Loading net worth.',
  overview: {
    title: 'Net worth',
    description: 'Separates what is available from what cannot be used now.',
    cash: 'Balance in accounts',
    availableAssets: 'Available assets',
    reservedAssets: 'Unavailable assets',
    reservedTag: 'Unavailable',
    receivables: 'To receive',
    debts: 'Debts',
    notDoubleCount:
      'Do not register as an asset a balance that is already in an account, so it is not counted twice.',
    reservedNote:
      'FGTS and other unavailable assets stay out of the available amount and the emergency reserve.',
  },
  reserve: {
    title: 'Emergency reserve',
    description: 'How many months of your fixed expenses the reserve covers.',
    amount: 'Reserve',
    monthlyBase: 'Fixed expenses this month (my share)',
    coverage: 'Coverage',
    coverageValue: '{months} months',
    noBase: 'No fixed expenses this month, so the coverage cannot be calculated.',
    targetMonths: 'Coverage goal, in months',
    targetHint: 'From 1 to 60 months.',
    apply: 'Calculate goal',
    clear: 'Clear goal',
    targetAmount: 'Goal amount',
    missing: 'Missing to reach the goal',
    targetNote: 'The goal is only used for this calculation and is not saved.',
    countsNote: 'Only available assets marked as reserve count here. FGTS never counts.',
    targetInvalid: 'Enter a goal from 1 to 60 months.',
    targetLabel: 'Goal of {months} months',
  },
  assets: {
    title: 'Assets',
    add: 'New asset',
    loading: 'Loading assets.',
    statusLabel: 'Asset status',
    status: { active: 'Active', archived: 'Archived' },
    empty: {
      title: 'No asset registered',
      description:
        'Register your FGTS or another balance that is not in an account to see the full net worth.',
      action: 'New asset',
    },
    emptyArchived: 'No archived asset.',
    kind: { FGTS: 'FGTS', OTHER: 'Other asset' },
    availability: { RESERVED: 'Unavailable', AVAILABLE: 'Available' },
    countsAsReserve: 'Counts as reserve',
    employer: 'Employer: {name}',
    monthlyDeposit: 'Monthly deposit: {amount}',
    balanceOn: 'Balance on {date}',
    archived: 'Archived',
    updateBalance: 'Update balance',
    edit: 'Edit',
    archive: 'Archive',
    showHistory: 'See history',
    hideHistory: 'Hide history',
    actionAria: '{action}: {name}',
    history: {
      title: 'Balance history',
      loading: 'Loading the history.',
      empty: 'No balance update.',
      line: '{amount} on {date}',
      recordedAt: 'Recorded on {date}',
    },
    archiveTitle: 'Archive this asset?',
    archiveDescription:
      'The asset leaves the net worth totals. Nothing is deleted and the balance history stays.',
    archiveConfirm: 'Archive',
    archiveToast: 'Asset archived.',
    cancel: 'Cancel',
  },
  form: {
    title: 'New asset',
    editTitle: 'Edit asset',
    kind: 'Type',
    name: 'Name',
    employer: 'Employer (optional)',
    balance: 'Balance',
    balanceDate: 'Balance date',
    balanceNote:
      'To change the balance later, update it on the asset itself: the history is preserved.',
    monthlyDeposit: 'Expected monthly deposit (optional)',
    monthlyDepositHint: 'Informational only: it does not create an entry.',
    availability: 'Availability',
    availabilityHint: 'FGTS is always unavailable.',
    countsAsReserve: 'Counts in the emergency reserve',
    countsHint: 'Only valid for an available asset.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    toast: 'Asset created.',
    toastUpdated: 'Asset updated.',
  },
  balanceForm: {
    title: 'Update balance',
    description: 'The new balance goes into the history. It creates no entry or income.',
    balance: 'New balance',
    date: 'Balance date',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    toast: 'Balance updated.',
  },
};

export const netWorthEs: NetWorthCopy = {
  pageTitle: 'Patrimonio',
  loading: 'Cargando el patrimonio.',
  overview: {
    title: 'Patrimonio',
    description: 'Separa lo que está disponible de lo que no se puede usar ahora.',
    cash: 'Saldo en cuentas',
    availableAssets: 'Activos disponibles',
    reservedAssets: 'Activos no disponibles',
    reservedTag: 'No disponible',
    receivables: 'Por cobrar',
    debts: 'Deudas',
    notDoubleCount:
      'No registres como activo un saldo que ya está en una cuenta, para no contarlo dos veces.',
    reservedNote:
      'El FGTS y otros activos no disponibles quedan fuera de lo disponible y de la reserva de emergencia.',
  },
  reserve: {
    title: 'Reserva de emergencia',
    description: 'Cuántos meses de tus gastos fijos cubre la reserva.',
    amount: 'Reserva',
    monthlyBase: 'Gastos fijos del mes (mi parte)',
    coverage: 'Cobertura',
    coverageValue: '{months} meses',
    noBase: 'Sin gastos fijos este mes, así que no se puede calcular la cobertura.',
    targetMonths: 'Meta de cobertura, en meses',
    targetHint: 'De 1 a 60 meses.',
    apply: 'Calcular meta',
    clear: 'Quitar meta',
    targetAmount: 'Valor de la meta',
    missing: 'Falta para la meta',
    targetNote: 'La meta sirve solo para este cálculo y no se guarda.',
    countsNote:
      'Solo cuentan aquí los activos disponibles marcados como reserva. El FGTS nunca cuenta.',
    targetInvalid: 'Informa una meta de 1 a 60 meses.',
    targetLabel: 'Meta de {months} meses',
  },
  assets: {
    title: 'Activos',
    add: 'Nuevo activo',
    loading: 'Cargando los activos.',
    statusLabel: 'Estado de los activos',
    status: { active: 'Activos', archived: 'Archivados' },
    empty: {
      title: 'Ningún activo registrado',
      description:
        'Registra el FGTS u otro saldo que no está en una cuenta para ver el patrimonio completo.',
      action: 'Nuevo activo',
    },
    emptyArchived: 'No hay activos archivados.',
    kind: { FGTS: 'FGTS', OTHER: 'Otro activo' },
    availability: { RESERVED: 'No disponible', AVAILABLE: 'Disponible' },
    countsAsReserve: 'Cuenta en la reserva',
    employer: 'Empleador: {name}',
    monthlyDeposit: 'Depósito mensual: {amount}',
    balanceOn: 'Saldo al {date}',
    archived: 'Archivado',
    updateBalance: 'Actualizar saldo',
    edit: 'Editar',
    archive: 'Archivar',
    showHistory: 'Ver historial',
    hideHistory: 'Ocultar historial',
    actionAria: '{action}: {name}',
    history: {
      title: 'Historial de saldo',
      loading: 'Cargando el historial.',
      empty: 'Ninguna actualización de saldo.',
      line: '{amount} el {date}',
      recordedAt: 'Registrado el {date}',
    },
    archiveTitle: '¿Archivar este activo?',
    archiveDescription:
      'El activo sale de las sumas del patrimonio. No se borra nada y el historial de saldo permanece.',
    archiveConfirm: 'Archivar',
    archiveToast: 'Activo archivado.',
    cancel: 'Cancelar',
  },
  form: {
    title: 'Nuevo activo',
    editTitle: 'Editar activo',
    kind: 'Tipo',
    name: 'Nombre',
    employer: 'Empleador (opcional)',
    balance: 'Saldo',
    balanceDate: 'Fecha del saldo',
    balanceNote:
      'Para cambiar el saldo después, actualízalo en el propio activo: el historial se conserva.',
    monthlyDeposit: 'Depósito mensual esperado (opcional)',
    monthlyDepositHint: 'Solo informativo: no genera movimiento.',
    availability: 'Disponibilidad',
    availabilityHint: 'El FGTS es siempre no disponible.',
    countsAsReserve: 'Cuenta en la reserva de emergencia',
    countsHint: 'Solo vale para un activo disponible.',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    toast: 'Activo creado.',
    toastUpdated: 'Activo actualizado.',
  },
  balanceForm: {
    title: 'Actualizar saldo',
    description: 'El saldo nuevo entra en el historial. No genera movimiento ni ingreso.',
    balance: 'Saldo nuevo',
    date: 'Fecha del saldo',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    toast: 'Saldo actualizado.',
  },
};
