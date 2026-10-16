export interface CardCashOutCopy {
  readonly title: string;
  readonly description: string;
  readonly principal: string;
  readonly installments: string;
  readonly installmentsValue: string;
  readonly costMode: {
    readonly label: string;
    readonly TOTAL: string;
    readonly RATE: string;
  };
  readonly total: string;
  readonly totalHint: string;
  readonly rate: string;
  readonly rateHint: string;
  readonly firstInvoice: string;
  readonly firstInvoiceHint: string;
  readonly destination: {
    readonly label: string;
    readonly ME: string;
    readonly PERSON: string;
  };
  readonly account: string;
  readonly noAccounts: string;
  readonly person: string;
  readonly noPeople: string;
  readonly channel: string;
  readonly channelHint: string;
  readonly loadError: string;
  readonly retry: string;
  readonly save: string;
  readonly saving: string;
  readonly cancel: string;
  readonly toast: string;
  readonly effectiveRate: {
    readonly title: string;
    readonly monthly: string;
    readonly annual: string;
    readonly none: string;
    readonly note: string;
  };
  readonly channelLabel: string;
  readonly kind: {
    readonly CARD_CASH_OUT: string;
    readonly PAYROLL: string;
  };
}

export const cardCashOutPt: CardCashOutCopy = {
  title: 'Pix no crédito',
  description: 'O valor que cai na conta não é gasto: só os juros contam como custo.',
  principal: 'Valor do Pix',
  installments: 'Parcelas',
  installmentsValue: '{count}x',
  costMode: {
    label: 'Como informar o custo',
    TOTAL: 'Total das parcelas',
    RATE: 'Taxa ao mês',
  },
  total: 'Total com juros',
  totalHint: 'A soma de todas as parcelas, como aparece no app do banco.',
  rate: 'Taxa ao mês (%)',
  rateHint: 'Use até duas casas decimais, por exemplo 3,5.',
  firstInvoice: 'Data da primeira fatura',
  firstInvoiceHint: 'A primeira parcela cai na fatura desta data.',
  destination: {
    label: 'Quem recebeu o Pix',
    ME: 'Eu',
    PERSON: 'Outra pessoa',
  },
  account: 'Conta que recebe',
  noAccounts: 'Cadastre uma conta para receber o valor.',
  person: 'Pessoa',
  noPeople: 'Cadastre uma pessoa para registrar o Pix em nome dela.',
  channel: 'Canal',
  channelHint: 'Opcional. Por exemplo, o app em que você fez o Pix.',
  loadError: 'Não foi possível carregar contas e pessoas.',
  retry: 'Tentar de novo',
  save: 'Registrar Pix',
  saving: 'Registrando…',
  cancel: 'Cancelar',
  toast: 'Pix no crédito registrado.',
  effectiveRate: {
    title: 'Taxa efetiva',
    monthly: 'Ao mês',
    annual: 'Ao ano',
    none: 'Sem dados para calcular a taxa.',
    note: 'Calculada sobre as parcelas, como o banco faz.',
  },
  channelLabel: 'Canal',
  kind: {
    CARD_CASH_OUT: 'Pix no crédito',
    PAYROLL: 'Consignado',
  },
};

export const cardCashOutEn: CardCashOutCopy = {
  title: 'Cash out on credit',
  description:
    'The money that lands in your account is not spending: only the interest counts as a cost.',
  principal: 'Pix amount',
  installments: 'Installments',
  installmentsValue: '{count}x',
  costMode: {
    label: 'How to enter the cost',
    TOTAL: 'Total of the installments',
    RATE: 'Monthly rate',
  },
  total: 'Total with interest',
  totalHint: 'The sum of all installments, as shown in the bank app.',
  rate: 'Monthly rate (%)',
  rateHint: 'Use up to two decimal places, for example 3.5.',
  firstInvoice: 'First invoice date',
  firstInvoiceHint: 'The first installment lands on the invoice of this date.',
  destination: {
    label: 'Who received the Pix',
    ME: 'Me',
    PERSON: 'Someone else',
  },
  account: 'Receiving account',
  noAccounts: 'Add an account to receive the money.',
  person: 'Person',
  noPeople: 'Add a person to register the Pix on their behalf.',
  channel: 'Channel',
  channelHint: 'Optional. For example, the app where you made the Pix.',
  loadError: 'Could not load accounts and people.',
  retry: 'Try again',
  save: 'Register Pix',
  saving: 'Registering…',
  cancel: 'Cancel',
  toast: 'Cash out on credit registered.',
  effectiveRate: {
    title: 'Effective rate',
    monthly: 'Per month',
    annual: 'Per year',
    none: 'Not enough data to calculate the rate.',
    note: 'Calculated over the installments, the way the bank does.',
  },
  channelLabel: 'Channel',
  kind: {
    CARD_CASH_OUT: 'Cash out on credit',
    PAYROLL: 'Payroll loan',
  },
};

export const cardCashOutEs: CardCashOutCopy = {
  title: 'Efectivo con tarjeta',
  description:
    'El dinero que llega a tu cuenta no es gasto: solo los intereses cuentan como costo.',
  principal: 'Valor del Pix',
  installments: 'Cuotas',
  installmentsValue: '{count}x',
  costMode: {
    label: 'Cómo informar el costo',
    TOTAL: 'Total de las cuotas',
    RATE: 'Tasa mensual',
  },
  total: 'Total con intereses',
  totalHint: 'La suma de todas las cuotas, como aparece en la app del banco.',
  rate: 'Tasa mensual (%)',
  rateHint: 'Usa hasta dos decimales, por ejemplo 3,5.',
  firstInvoice: 'Fecha de la primera factura',
  firstInvoiceHint: 'La primera cuota cae en la factura de esta fecha.',
  destination: {
    label: 'Quién recibió el Pix',
    ME: 'Yo',
    PERSON: 'Otra persona',
  },
  account: 'Cuenta que recibe',
  noAccounts: 'Registra una cuenta para recibir el dinero.',
  person: 'Persona',
  noPeople: 'Registra una persona para anotar el Pix a su nombre.',
  channel: 'Canal',
  channelHint: 'Opcional. Por ejemplo, la app en la que hiciste el Pix.',
  loadError: 'No se pudieron cargar las cuentas y las personas.',
  retry: 'Intentar de nuevo',
  save: 'Registrar Pix',
  saving: 'Registrando…',
  cancel: 'Cancelar',
  toast: 'Efectivo con tarjeta registrado.',
  effectiveRate: {
    title: 'Tasa efectiva',
    monthly: 'Al mes',
    annual: 'Al año',
    none: 'Sin datos para calcular la tasa.',
    note: 'Calculada sobre las cuotas, como lo hace el banco.',
  },
  channelLabel: 'Canal',
  kind: {
    CARD_CASH_OUT: 'Efectivo con tarjeta',
    PAYROLL: 'Préstamo con descuento en nómina',
  },
};
