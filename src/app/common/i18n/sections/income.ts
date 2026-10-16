export interface IncomeCopy {
  readonly pageTitle: string;
  readonly loading: string;
  readonly add: string;
  readonly statusLabel: string;
  readonly status: { readonly active: string; readonly archived: string };
  readonly empty: {
    readonly title: string;
    readonly description: string;
    readonly action: string;
  };
  readonly emptyArchived: string;
  readonly profile: {
    readonly gross: string;
    readonly dependents: string;
    readonly advance: string;
    readonly noAdvance: string;
    readonly balance: string;
    readonly thirteenth: string;
    readonly noThirteenth: string;
    readonly deductions: string;
    readonly noDeductions: string;
    readonly archived: string;
    readonly edit: string;
    readonly archive: string;
    readonly preview: string;
    readonly previewing: string;
    readonly actionAria: string;
    readonly archiveTitle: string;
    readonly archiveDescription: string;
    readonly archiveConfirm: string;
    readonly archiveToast: string;
    readonly cancel: string;
  };
  readonly deduction: {
    readonly kind: {
      readonly TAX: string;
      readonly BENEFIT: string;
      readonly UNION: string;
      readonly LOAN: string;
      readonly OTHER: string;
    };
    readonly percentOfGross: string;
    readonly since: string;
    readonly until: string;
    readonly between: string;
    readonly loanLinked: string;
    readonly openDebt: string;
    readonly interest: string;
    readonly interestNotSplit: string;
  };
  readonly preview: {
    readonly title: string;
    readonly description: string;
    readonly month: string;
    readonly select: string;
    readonly loading: string;
    readonly gross: string;
    readonly inss: string;
    readonly irrf: string;
    readonly fixed: string;
    readonly loan: string;
    readonly net: string;
    readonly advance: string;
    readonly balance: string;
    readonly thirteenth: string;
    readonly tables: string;
    readonly tableLine: string;
    readonly estimated: string;
    readonly principal: string;
    readonly note: string;
    readonly unavailableTitle: string;
    readonly unavailableText: string;
    readonly noPayments: string;
  };
  readonly generate: {
    readonly title: string;
    readonly description: string;
    readonly from: string;
    readonly to: string;
    readonly action: string;
    readonly generating: string;
    readonly result: string;
    readonly created: string;
    readonly existing: string;
    readonly kind: {
      readonly ADVANCE: string;
      readonly BALANCE: string;
      readonly THIRTEENTH_FIRST: string;
    };
    readonly itemLine: string;
    readonly seePending: string;
    readonly windowHint: string;
    readonly invalidWindow: string;
  };
  readonly taxTables: {
    readonly title: string;
    readonly description: string;
    readonly year: string;
    readonly loading: string;
    readonly unavailableTitle: string;
    readonly unavailableText: string;
    readonly kind: { readonly INSS: string; readonly IRRF: string };
    readonly basis: { readonly COMPETENCE: string; readonly PAYMENT_DATE: string };
    readonly effective: string;
    readonly effectiveBetween: string;
    readonly version: string;
    readonly source: string;
    readonly brackets: string;
    readonly bracketLine: string;
    readonly bracketOpen: string;
    readonly ceiling: string;
    readonly retry: string;
  };
  readonly form: {
    readonly title: string;
    readonly editTitle: string;
    readonly source: string;
    readonly gross: string;
    readonly dependents: string;
    readonly advanceEnabled: string;
    readonly advanceDay: string;
    readonly advancePercent: string;
    readonly advancePercentHint: string;
    readonly balanceDay: string;
    readonly balanceDayHint: string;
    readonly thirteenthEnabled: string;
    readonly thirteenthMonth: string;
    readonly deductions: string;
    readonly addDeduction: string;
    readonly removeDeduction: string;
    readonly deductionTitle: string;
    readonly deductionKind: string;
    readonly deductionLabel: string;
    readonly deductionMode: string;
    readonly modeAmount: string;
    readonly modePercent: string;
    readonly deductionAmount: string;
    readonly deductionPercent: string;
    readonly deductionPercentHint: string;
    readonly startsOn: string;
    readonly endsOn: string;
    readonly debt: string;
    readonly debtHint: string;
    readonly noDebts: string;
    readonly interest: string;
    readonly interestHint: string;
    readonly cancel: string;
    readonly save: string;
    readonly saving: string;
    readonly toast: string;
    readonly toastUpdated: string;
  };
}

export const incomePt: IncomeCopy = {
  pageTitle: 'Renda',
  loading: 'Carregando os perfis de renda.',
  add: 'Novo perfil de renda',
  statusLabel: 'Situação dos perfis',
  status: { active: 'Ativos', archived: 'Arquivados' },
  empty: {
    title: 'Nenhum perfil de renda ainda',
    description:
      'Cadastre o salário bruto e os descontos em folha para ver o líquido, o adiantamento e o saldo de cada mês.',
    action: 'Novo perfil de renda',
  },
  emptyArchived: 'Nenhum perfil arquivado.',
  profile: {
    gross: 'Salário bruto',
    dependents: 'Dependentes: {count}',
    advance: 'Adiantamento de {percent} do líquido no dia {day}',
    noAdvance: 'Sem adiantamento: o líquido cai inteiro no dia do saldo',
    balance: 'Saldo no dia {day} do mês seguinte',
    thirteenth: '13º salário: 1ª parcela em {month}',
    noThirteenth: 'Sem 13º salário',
    deductions: 'Descontos em folha',
    noDeductions: 'Nenhum desconto além de INSS e IRRF.',
    archived: 'Arquivado',
    edit: 'Editar',
    archive: 'Arquivar',
    preview: 'Ver prévia',
    previewing: 'Em prévia',
    actionAria: '{action}: {name}',
    archiveTitle: 'Arquivar este perfil?',
    archiveDescription:
      'O perfil deixa de gerar receitas previstas. Nada é apagado e as receitas já geradas continuam como estão.',
    archiveConfirm: 'Arquivar',
    archiveToast: 'Perfil arquivado.',
    cancel: 'Cancelar',
  },
  deduction: {
    kind: {
      TAX: 'Imposto',
      BENEFIT: 'Benefício',
      UNION: 'Sindicato',
      LOAN: 'Consignado',
      OTHER: 'Outro',
    },
    percentOfGross: '{percent} do bruto',
    since: 'Desde {date}',
    until: 'Até {date}',
    between: 'De {from} a {to}',
    loanLinked: 'Ligado à dívida',
    openDebt: 'Abrir a dívida',
    interest: 'Juros da parcela: {amount}',
    interestNotSplit:
      'Os juros da parcela não foram informados: a dívida baixa só o principal e o valor é uma estimativa.',
  },
  preview: {
    title: 'Prévia do líquido',
    description: 'Calculada pelo servidor com as tabelas fiscais vigentes. Nada é lançado.',
    month: 'Competência',
    select: 'Escolha um perfil para ver a prévia.',
    loading: 'Calculando o líquido.',
    gross: 'Bruto',
    inss: 'INSS',
    irrf: 'IRRF',
    fixed: 'Descontos fixos',
    loan: 'Consignado em folha',
    net: 'Líquido',
    advance: 'Adiantamento em {date}',
    balance: 'Saldo em {date}',
    thirteenth: '13º salário, 1ª parcela em {date}',
    tables: 'Tabelas usadas',
    tableLine: '{kind}, versão {version}, vigente desde {date}',
    estimated: 'Estimado',
    principal: 'Principal baixado: {amount}',
    note: 'O adiantamento mais o saldo é igual ao líquido.',
    unavailableTitle: 'Tabela fiscal indisponível',
    unavailableText:
      'Não há tabela de INSS ou IRRF vigente para esta competência, então o líquido não pôde ser calculado.',
    noPayments: 'Sem pagamentos nesta competência.',
  },
  generate: {
    title: 'Gerar receitas previstas',
    description:
      'Cria uma receita prevista para cada pagamento do período. Rodar de novo não duplica e nada é confirmado por você.',
    from: 'Da competência',
    to: 'Até a competência',
    action: 'Gerar receitas',
    generating: 'Gerando…',
    result: '{created} novas e {existing} que já existiam.',
    created: 'Nova',
    existing: 'Já existia',
    kind: {
      ADVANCE: 'Adiantamento',
      BALANCE: 'Saldo',
      THIRTEENTH_FIRST: '13º, 1ª parcela',
    },
    itemLine: '{kind} de {competence}, em {date}',
    seePending: 'Ver pendentes',
    windowHint: 'A janela vai até 12 meses.',
    invalidWindow: 'Escolha um período de até 12 meses, do início ao fim.',
  },
  taxTables: {
    title: 'Tabelas fiscais',
    description: 'INSS pela competência e IRRF pela data de pagamento. Somente leitura.',
    year: 'Ano',
    loading: 'Carregando as tabelas fiscais.',
    unavailableTitle: 'Tabela fiscal indisponível',
    unavailableText:
      'Não há tabela de INSS ou IRRF vigente em {year}. Sem ela, o líquido não pode ser calculado.',
    kind: { INSS: 'INSS', IRRF: 'IRRF' },
    basis: { COMPETENCE: 'Vale pela competência', PAYMENT_DATE: 'Vale pela data de pagamento' },
    effective: 'Vigente desde {from}',
    effectiveBetween: 'Vigente de {from} a {to}',
    version: 'Versão {version}',
    source: 'Fonte: {agency}, {norm}',
    brackets: 'Faixas',
    bracketLine: 'De {from} até {to}: {rate}',
    bracketOpen: 'Acima de {from}: {rate}',
    ceiling: 'Teto de contribuição: {amount}',
    retry: 'Tentar de novo',
  },
  form: {
    title: 'Novo perfil de renda',
    editTitle: 'Editar perfil de renda',
    source: 'Fonte pagadora',
    gross: 'Salário bruto mensal',
    dependents: 'Dependentes',
    advanceEnabled: 'Recebo adiantamento',
    advanceDay: 'Dia do adiantamento',
    advancePercent: 'Percentual do líquido, em %',
    advancePercentHint: 'Por exemplo, 40 para 40% do líquido.',
    balanceDay: 'Dia do saldo',
    balanceDayHint: 'O saldo cai no mês seguinte à competência.',
    thirteenthEnabled: 'Recebo 13º salário',
    thirteenthMonth: 'Mês da 1ª parcela',
    deductions: 'Descontos em folha',
    addDeduction: 'Adicionar desconto',
    removeDeduction: 'Remover desconto {number}',
    deductionTitle: 'Desconto {number}',
    deductionKind: 'Tipo',
    deductionLabel: 'Nome do desconto',
    deductionMode: 'Como informar',
    modeAmount: 'Valor',
    modePercent: '% do bruto',
    deductionAmount: 'Valor mensal',
    deductionPercent: 'Percentual do bruto, em %',
    deductionPercentHint: 'Por exemplo, 1,5 para 1,5%.',
    startsOn: 'Começa em (opcional)',
    endsOn: 'Termina em (opcional)',
    debt: 'Dívida do consignado',
    debtHint: 'A parcela do consignado baixa esta dívida, e a saída não é contada duas vezes.',
    noDebts: 'Nenhuma dívida a pagar cadastrada.',
    interest: 'Juros da parcela (opcional)',
    interestHint: 'Sem os juros, a dívida baixa só o principal e o valor é uma estimativa.',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando…',
    toast: 'Perfil de renda criado.',
    toastUpdated: 'Perfil de renda atualizado.',
  },
};

export const incomeEn: IncomeCopy = {
  pageTitle: 'Income',
  loading: 'Loading income profiles.',
  add: 'New income profile',
  statusLabel: 'Profile status',
  status: { active: 'Active', archived: 'Archived' },
  empty: {
    title: 'No income profile yet',
    description:
      'Add your gross salary and payroll deductions to see the net pay, the advance and the balance of each month.',
    action: 'New income profile',
  },
  emptyArchived: 'No archived profile.',
  profile: {
    gross: 'Gross salary',
    dependents: 'Dependents: {count}',
    advance: 'Advance of {percent} of the net pay on day {day}',
    noAdvance: 'No advance: the whole net pay arrives on the balance day',
    balance: 'Balance on day {day} of the following month',
    thirteenth: '13th salary: 1st installment in {month}',
    noThirteenth: 'No 13th salary',
    deductions: 'Payroll deductions',
    noDeductions: 'No deduction besides INSS and IRRF.',
    archived: 'Archived',
    edit: 'Edit',
    archive: 'Archive',
    preview: 'See preview',
    previewing: 'In preview',
    actionAria: '{action}: {name}',
    archiveTitle: 'Archive this profile?',
    archiveDescription:
      'The profile stops generating expected income. Nothing is deleted and the income already generated stays as it is.',
    archiveConfirm: 'Archive',
    archiveToast: 'Profile archived.',
    cancel: 'Cancel',
  },
  deduction: {
    kind: {
      TAX: 'Tax',
      BENEFIT: 'Benefit',
      UNION: 'Union',
      LOAN: 'Payroll loan',
      OTHER: 'Other',
    },
    percentOfGross: '{percent} of gross',
    since: 'Since {date}',
    until: 'Until {date}',
    between: 'From {from} to {to}',
    loanLinked: 'Linked to the debt',
    openDebt: 'Open the debt',
    interest: 'Installment interest: {amount}',
    interestNotSplit:
      'The installment interest was not informed: the debt only drops the principal and the amount is an estimate.',
  },
  preview: {
    title: 'Net pay preview',
    description: 'Calculated by the server with the tax tables in force. Nothing is posted.',
    month: 'Competence',
    select: 'Choose a profile to see the preview.',
    loading: 'Calculating the net pay.',
    gross: 'Gross',
    inss: 'INSS',
    irrf: 'IRRF',
    fixed: 'Fixed deductions',
    loan: 'Payroll loan',
    net: 'Net pay',
    advance: 'Advance on {date}',
    balance: 'Balance on {date}',
    thirteenth: '13th salary, 1st installment on {date}',
    tables: 'Tables used',
    tableLine: '{kind}, version {version}, in force since {date}',
    estimated: 'Estimated',
    principal: 'Principal paid down: {amount}',
    note: 'The advance plus the balance equals the net pay.',
    unavailableTitle: 'Tax table unavailable',
    unavailableText:
      'There is no INSS or IRRF table in force for this competence, so the net pay could not be calculated.',
    noPayments: 'No payments in this competence.',
  },
  generate: {
    title: 'Generate expected income',
    description:
      'Creates an expected income for each payment of the period. Running it again does not duplicate, and nothing is confirmed for you.',
    from: 'From competence',
    to: 'Until competence',
    action: 'Generate income',
    generating: 'Generating…',
    result: '{created} new and {existing} that already existed.',
    created: 'New',
    existing: 'Already existed',
    kind: {
      ADVANCE: 'Advance',
      BALANCE: 'Balance',
      THIRTEENTH_FIRST: '13th, 1st installment',
    },
    itemLine: '{kind} of {competence}, on {date}',
    seePending: 'See pending',
    windowHint: 'The window goes up to 12 months.',
    invalidWindow: 'Choose a period of up to 12 months, from start to end.',
  },
  taxTables: {
    title: 'Tax tables',
    description: 'INSS by competence and IRRF by payment date. Read only.',
    year: 'Year',
    loading: 'Loading the tax tables.',
    unavailableTitle: 'Tax table unavailable',
    unavailableText:
      'There is no INSS or IRRF table in force in {year}. Without it, the net pay cannot be calculated.',
    kind: { INSS: 'INSS', IRRF: 'IRRF' },
    basis: { COMPETENCE: 'Applies by competence', PAYMENT_DATE: 'Applies by payment date' },
    effective: 'In force since {from}',
    effectiveBetween: 'In force from {from} to {to}',
    version: 'Version {version}',
    source: 'Source: {agency}, {norm}',
    brackets: 'Brackets',
    bracketLine: 'From {from} to {to}: {rate}',
    bracketOpen: 'Above {from}: {rate}',
    ceiling: 'Contribution ceiling: {amount}',
    retry: 'Try again',
  },
  form: {
    title: 'New income profile',
    editTitle: 'Edit income profile',
    source: 'Paying source',
    gross: 'Monthly gross salary',
    dependents: 'Dependents',
    advanceEnabled: 'I receive an advance',
    advanceDay: 'Advance day',
    advancePercent: 'Percentage of the net pay, in %',
    advancePercentHint: 'For example, 40 for 40% of the net pay.',
    balanceDay: 'Balance day',
    balanceDayHint: 'The balance arrives in the month after the competence.',
    thirteenthEnabled: 'I receive a 13th salary',
    thirteenthMonth: 'Month of the 1st installment',
    deductions: 'Payroll deductions',
    addDeduction: 'Add deduction',
    removeDeduction: 'Remove deduction {number}',
    deductionTitle: 'Deduction {number}',
    deductionKind: 'Type',
    deductionLabel: 'Deduction name',
    deductionMode: 'How to enter it',
    modeAmount: 'Amount',
    modePercent: '% of gross',
    deductionAmount: 'Monthly amount',
    deductionPercent: 'Percentage of gross, in %',
    deductionPercentHint: 'For example, 1.5 for 1.5%.',
    startsOn: 'Starts on (optional)',
    endsOn: 'Ends on (optional)',
    debt: 'Payroll loan debt',
    debtHint: 'The loan installment pays down this debt, and the outflow is not counted twice.',
    noDebts: 'No payable debt registered.',
    interest: 'Installment interest (optional)',
    interestHint:
      'Without the interest, the debt only drops the principal and the amount is an estimate.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    toast: 'Income profile created.',
    toastUpdated: 'Income profile updated.',
  },
};

export const incomeEs: IncomeCopy = {
  pageTitle: 'Ingresos',
  loading: 'Cargando los perfiles de ingreso.',
  add: 'Nuevo perfil de ingreso',
  statusLabel: 'Estado de los perfiles',
  status: { active: 'Activos', archived: 'Archivados' },
  empty: {
    title: 'Aún no hay perfil de ingreso',
    description:
      'Registra el salario bruto y los descuentos en nómina para ver el neto, el adelanto y el saldo de cada mes.',
    action: 'Nuevo perfil de ingreso',
  },
  emptyArchived: 'No hay perfiles archivados.',
  profile: {
    gross: 'Salario bruto',
    dependents: 'Dependientes: {count}',
    advance: 'Adelanto de {percent} del neto el día {day}',
    noAdvance: 'Sin adelanto: el neto llega completo el día del saldo',
    balance: 'Saldo el día {day} del mes siguiente',
    thirteenth: 'Decimotercer salario: 1.ª cuota en {month}',
    noThirteenth: 'Sin decimotercer salario',
    deductions: 'Descuentos en nómina',
    noDeductions: 'Ningún descuento además de INSS e IRRF.',
    archived: 'Archivado',
    edit: 'Editar',
    archive: 'Archivar',
    preview: 'Ver vista previa',
    previewing: 'En vista previa',
    actionAria: '{action}: {name}',
    archiveTitle: '¿Archivar este perfil?',
    archiveDescription:
      'El perfil deja de generar ingresos previstos. No se borra nada y los ingresos ya generados siguen como están.',
    archiveConfirm: 'Archivar',
    archiveToast: 'Perfil archivado.',
    cancel: 'Cancelar',
  },
  deduction: {
    kind: {
      TAX: 'Impuesto',
      BENEFIT: 'Beneficio',
      UNION: 'Sindicato',
      LOAN: 'Préstamo en nómina',
      OTHER: 'Otro',
    },
    percentOfGross: '{percent} del bruto',
    since: 'Desde {date}',
    until: 'Hasta {date}',
    between: 'De {from} a {to}',
    loanLinked: 'Vinculado a la deuda',
    openDebt: 'Abrir la deuda',
    interest: 'Intereses de la cuota: {amount}',
    interestNotSplit:
      'No se informaron los intereses de la cuota: la deuda solo baja el principal y el valor es una estimación.',
  },
  preview: {
    title: 'Vista previa del neto',
    description: 'Calculada por el servidor con las tablas fiscales vigentes. No se registra nada.',
    month: 'Competencia',
    select: 'Elige un perfil para ver la vista previa.',
    loading: 'Calculando el neto.',
    gross: 'Bruto',
    inss: 'INSS',
    irrf: 'IRRF',
    fixed: 'Descuentos fijos',
    loan: 'Préstamo en nómina',
    net: 'Neto',
    advance: 'Adelanto el {date}',
    balance: 'Saldo el {date}',
    thirteenth: 'Decimotercer salario, 1.ª cuota el {date}',
    tables: 'Tablas usadas',
    tableLine: '{kind}, versión {version}, vigente desde {date}',
    estimated: 'Estimado',
    principal: 'Principal amortizado: {amount}',
    note: 'El adelanto más el saldo es igual al neto.',
    unavailableTitle: 'Tabla fiscal no disponible',
    unavailableText:
      'No hay tabla de INSS o IRRF vigente para esta competencia, así que no se pudo calcular el neto.',
    noPayments: 'Sin pagos en esta competencia.',
  },
  generate: {
    title: 'Generar ingresos previstos',
    description:
      'Crea un ingreso previsto por cada pago del período. Ejecutarlo de nuevo no duplica y nada se confirma por ti.',
    from: 'Desde la competencia',
    to: 'Hasta la competencia',
    action: 'Generar ingresos',
    generating: 'Generando…',
    result: '{created} nuevos y {existing} que ya existían.',
    created: 'Nuevo',
    existing: 'Ya existía',
    kind: {
      ADVANCE: 'Adelanto',
      BALANCE: 'Saldo',
      THIRTEENTH_FIRST: 'Decimotercero, 1.ª cuota',
    },
    itemLine: '{kind} de {competence}, el {date}',
    seePending: 'Ver pendientes',
    windowHint: 'La ventana llega hasta 12 meses.',
    invalidWindow: 'Elige un período de hasta 12 meses, de inicio a fin.',
  },
  taxTables: {
    title: 'Tablas fiscales',
    description: 'INSS por competencia e IRRF por fecha de pago. Solo lectura.',
    year: 'Año',
    loading: 'Cargando las tablas fiscales.',
    unavailableTitle: 'Tabla fiscal no disponible',
    unavailableText:
      'No hay tabla de INSS o IRRF vigente en {year}. Sin ella, no se puede calcular el neto.',
    kind: { INSS: 'INSS', IRRF: 'IRRF' },
    basis: { COMPETENCE: 'Vale por competencia', PAYMENT_DATE: 'Vale por fecha de pago' },
    effective: 'Vigente desde {from}',
    effectiveBetween: 'Vigente de {from} a {to}',
    version: 'Versión {version}',
    source: 'Fuente: {agency}, {norm}',
    brackets: 'Tramos',
    bracketLine: 'De {from} hasta {to}: {rate}',
    bracketOpen: 'Por encima de {from}: {rate}',
    ceiling: 'Tope de cotización: {amount}',
    retry: 'Intentar de nuevo',
  },
  form: {
    title: 'Nuevo perfil de ingreso',
    editTitle: 'Editar perfil de ingreso',
    source: 'Fuente pagadora',
    gross: 'Salario bruto mensual',
    dependents: 'Dependientes',
    advanceEnabled: 'Recibo adelanto',
    advanceDay: 'Día del adelanto',
    advancePercent: 'Porcentaje del neto, en %',
    advancePercentHint: 'Por ejemplo, 40 para el 40% del neto.',
    balanceDay: 'Día del saldo',
    balanceDayHint: 'El saldo llega en el mes siguiente a la competencia.',
    thirteenthEnabled: 'Recibo decimotercer salario',
    thirteenthMonth: 'Mes de la 1.ª cuota',
    deductions: 'Descuentos en nómina',
    addDeduction: 'Agregar descuento',
    removeDeduction: 'Quitar descuento {number}',
    deductionTitle: 'Descuento {number}',
    deductionKind: 'Tipo',
    deductionLabel: 'Nombre del descuento',
    deductionMode: 'Cómo informarlo',
    modeAmount: 'Valor',
    modePercent: '% del bruto',
    deductionAmount: 'Valor mensual',
    deductionPercent: 'Porcentaje del bruto, en %',
    deductionPercentHint: 'Por ejemplo, 1,5 para el 1,5%.',
    startsOn: 'Empieza el (opcional)',
    endsOn: 'Termina el (opcional)',
    debt: 'Deuda del préstamo en nómina',
    debtHint: 'La cuota del préstamo amortiza esta deuda y la salida no se cuenta dos veces.',
    noDebts: 'No hay deudas por pagar registradas.',
    interest: 'Intereses de la cuota (opcional)',
    interestHint:
      'Sin los intereses, la deuda solo baja el principal y el valor es una estimación.',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    toast: 'Perfil de ingreso creado.',
    toastUpdated: 'Perfil de ingreso actualizado.',
  },
};
