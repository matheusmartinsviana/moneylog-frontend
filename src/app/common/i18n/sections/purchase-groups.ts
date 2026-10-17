export interface PurchaseGroupsCopy {
  readonly pageTitle: string;
  readonly loading: string;
  readonly add: string;
  readonly filterLabel: string;
  readonly filter: { readonly active: string; readonly done: string };
  readonly empty: {
    readonly title: string;
    readonly description: string;
    readonly action: string;
  };
  readonly emptyDone: string;
  readonly commitment: {
    readonly title: string;
    readonly until: string;
    readonly horizonLabel: string;
    readonly horizonOption: string;
    readonly committed: string;
    readonly mine: string;
    readonly note: string;
    readonly loading: string;
    readonly error: string;
    readonly retry: string;
    readonly byMonth: string;
  };
  readonly group: {
    readonly interest: string;
    readonly total: string;
    readonly remaining: string;
    readonly myRemaining: string;
    readonly perMonth: string;
    readonly endsIn: string;
    readonly noPending: string;
    readonly done: string;
    readonly members: string;
    readonly edit: string;
    readonly link: string;
    readonly openMembers: string;
  };
  readonly member: {
    readonly installments: string;
    readonly lastDue: string;
    readonly unlink: string;
    readonly unlinkAria: string;
    readonly noDescription: string;
    readonly total: string;
    readonly remaining: string;
    readonly perInstallment: string;
  };
  readonly divergence: {
    readonly title: string;
    readonly text: string;
    readonly note: string;
  };
  readonly form: {
    readonly title: string;
    readonly editTitle: string;
    readonly description: string;
    readonly name: string;
    readonly interest: string;
    readonly declaredTotal: string;
    readonly declaredHint: string;
    readonly members: string;
    readonly memberTitle: string;
    readonly card: string;
    readonly installmentAmount: string;
    readonly totalInstallments: string;
    readonly remainingInstallments: string;
    readonly remainingHint: string;
    readonly firstInvoiceDate: string;
    readonly firstInvoiceHint: string;
    readonly addMember: string;
    readonly removeMember: string;
    readonly cancel: string;
    readonly save: string;
    readonly saving: string;
    readonly toast: string;
    readonly toastUpdated: string;
    readonly noCards: string;
    readonly addCard: string;
    readonly editNote: string;
  };
  readonly link: {
    readonly title: string;
    readonly description: string;
    readonly search: string;
    readonly searching: string;
    readonly idle: string;
    readonly none: string;
    readonly choose: string;
    readonly chooseAria: string;
    readonly close: string;
    readonly toast: string;
    readonly unlinkToast: string;
  };
}

export const purchaseGroupsPt: PurchaseGroupsCopy = {
  pageTitle: 'Compras parceladas',
  loading: 'Carregando as compras parceladas.',
  add: 'Nova compra agrupada',
  filterLabel: 'Situação das compras',
  filter: { active: 'Em andamento', done: 'Quitadas' },
  empty: {
    title: 'Nenhuma compra agrupada ainda',
    description:
      'Junte as parcelas do mesmo item em cartões diferentes para ver quanto falta e quando termina.',
    action: 'Nova compra agrupada',
  },
  emptyDone: 'Nenhuma compra agrupada quitada.',
  commitment: {
    title: 'Comprometido em parcelas',
    until: 'Comprometido até {month}',
    horizonLabel: 'Até quando',
    horizonOption: '{count} meses',
    committed: 'Valor cheio',
    mine: 'Minha parte',
    note: 'Soma das parcelas ainda não pagas dos cartões. O grupo não duplica o valor das compras.',
    loading: 'Calculando o comprometido.',
    error: 'Não foi possível calcular o comprometido.',
    retry: 'Tentar de novo',
    byMonth: 'Por mês',
  },
  group: {
    interest: 'Com juros',
    total: 'Total',
    remaining: 'Falta pagar',
    myRemaining: 'Minha parte do que falta',
    perMonth: 'Parcelas deste mês',
    endsIn: 'Termina em {month}',
    noPending: 'Sem parcela a vencer',
    done: 'Quitada',
    members: 'Compras do grupo',
    edit: 'Editar',
    link: 'Vincular compra',
    openMembers: 'Ver as compras de {name}',
  },
  member: {
    installments: '{remaining} de {total} parcelas a vencer',
    lastDue: 'Última em {date}',
    unlink: 'Desvincular',
    unlinkAria: 'Desvincular {name} do grupo',
    noDescription: 'Compra sem descrição',
    total: 'Total',
    remaining: 'Falta',
    perInstallment: 'Parcela',
  },
  divergence: {
    title: 'O total informado é diferente',
    text: 'Você informou {declared}, mas as compras somam {computed}. A diferença é de {difference}.',
    note: 'O total do grupo é sempre a soma das compras.',
  },
  form: {
    title: 'Nova compra agrupada',
    editTitle: 'Editar compra agrupada',
    description:
      'Cada compra vira uma compra parcelada no cartão. Se já pagou parte, informe quantas parcelas faltam.',
    name: 'Nome do item',
    interest: 'A compra tem juros',
    declaredTotal: 'Total que você espera (opcional)',
    declaredHint: 'Só serve para conferir: o total do grupo é a soma das compras.',
    members: 'Compras em cada cartão',
    memberTitle: 'Compra {number}',
    card: 'Cartão',
    installmentAmount: 'Valor de cada parcela',
    totalInstallments: 'Parcelas no total',
    remainingInstallments: 'Parcelas que faltam',
    remainingHint: 'Deixe igual ao total se a compra é nova.',
    firstInvoiceDate: 'Data da próxima fatura a lançar',
    firstInvoiceHint: 'Uma data dentro do ciclo da fatura da primeira parcela a lançar.',
    addMember: 'Adicionar outro cartão',
    removeMember: 'Remover compra {number}',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando…',
    toast: 'Compra agrupada criada.',
    toastUpdated: 'Compra agrupada atualizada.',
    noCards: 'Cadastre um cartão para agrupar compras parceladas.',
    addCard: 'Novo cartão',
    editNote: 'Os valores vêm das compras do grupo. Aqui só dá para mudar o nome e os juros.',
  },
  link: {
    title: 'Vincular compra ao grupo',
    description: 'Escolha uma compra parcelada no cartão que ainda não está em nenhum grupo.',
    search: 'Buscar compra',
    searching: 'Buscando compras.',
    idle: 'Digite parte da descrição da compra.',
    none: 'Nenhuma compra encontrada.',
    choose: 'Vincular',
    chooseAria: 'Vincular {name} ao grupo',
    close: 'Fechar',
    toast: 'Compra vinculada.',
    unlinkToast: 'Compra desvinculada.',
  },
};

export const purchaseGroupsEn: PurchaseGroupsCopy = {
  pageTitle: 'Installment purchases',
  loading: 'Loading installment purchases.',
  add: 'New grouped purchase',
  filterLabel: 'Purchase status',
  filter: { active: 'In progress', done: 'Paid off' },
  empty: {
    title: 'No grouped purchases yet',
    description:
      'Group the installments of the same item across cards to see what is left and when it ends.',
    action: 'New grouped purchase',
  },
  emptyDone: 'No paid-off grouped purchases.',
  commitment: {
    title: 'Committed in installments',
    until: 'Committed until {month}',
    horizonLabel: 'Until when',
    horizonOption: '{count} months',
    committed: 'Full amount',
    mine: 'My share',
    note: 'Sum of the unpaid card installments. The group does not double count the purchases.',
    loading: 'Calculating the committed amount.',
    error: 'Could not calculate the committed amount.',
    retry: 'Try again',
    byMonth: 'By month',
  },
  group: {
    interest: 'With interest',
    total: 'Total',
    remaining: 'Left to pay',
    myRemaining: 'My share of what is left',
    perMonth: 'This month installments',
    endsIn: 'Ends in {month}',
    noPending: 'No installment due',
    done: 'Paid off',
    members: 'Purchases in the group',
    edit: 'Edit',
    link: 'Link purchase',
    openMembers: 'See the purchases of {name}',
  },
  member: {
    installments: '{remaining} of {total} installments due',
    lastDue: 'Last on {date}',
    unlink: 'Unlink',
    unlinkAria: 'Unlink {name} from the group',
    noDescription: 'Purchase without description',
    total: 'Total',
    remaining: 'Left',
    perInstallment: 'Installment',
  },
  divergence: {
    title: 'The informed total is different',
    text: 'You informed {declared}, but the purchases add up to {computed}. The difference is {difference}.',
    note: 'The group total is always the sum of the purchases.',
  },
  form: {
    title: 'New grouped purchase',
    editTitle: 'Edit grouped purchase',
    description:
      'Each purchase becomes an installment purchase on the card. If you already paid part of it, enter how many installments are left.',
    name: 'Item name',
    interest: 'The purchase has interest',
    declaredTotal: 'Total you expect (optional)',
    declaredHint: 'Only for checking: the group total is the sum of the purchases.',
    members: 'Purchases on each card',
    memberTitle: 'Purchase {number}',
    card: 'Card',
    installmentAmount: 'Amount of each installment',
    totalInstallments: 'Total installments',
    remainingInstallments: 'Installments left',
    remainingHint: 'Keep it equal to the total if the purchase is new.',
    firstInvoiceDate: 'Date of the next invoice to post',
    firstInvoiceHint: 'A date within the invoice cycle of the first installment to post.',
    addMember: 'Add another card',
    removeMember: 'Remove purchase {number}',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    toast: 'Grouped purchase created.',
    toastUpdated: 'Grouped purchase updated.',
    noCards: 'Add a card to group installment purchases.',
    addCard: 'New card',
    editNote:
      'Values come from the purchases in the group. Here you can only change the name and interest.',
  },
  link: {
    title: 'Link purchase to the group',
    description: 'Choose a card installment purchase that is not in any group yet.',
    search: 'Search purchase',
    searching: 'Searching purchases.',
    idle: 'Type part of the purchase description.',
    none: 'No purchase found.',
    choose: 'Link',
    chooseAria: 'Link {name} to the group',
    close: 'Close',
    toast: 'Purchase linked.',
    unlinkToast: 'Purchase unlinked.',
  },
};

export const purchaseGroupsEs: PurchaseGroupsCopy = {
  pageTitle: 'Compras a plazos',
  loading: 'Cargando las compras a plazos.',
  add: 'Nueva compra agrupada',
  filterLabel: 'Estado de las compras',
  filter: { active: 'En curso', done: 'Pagadas' },
  empty: {
    title: 'Aún no hay compras agrupadas',
    description:
      'Junta las cuotas del mismo artículo en tarjetas distintas para ver cuánto falta y cuándo termina.',
    action: 'Nueva compra agrupada',
  },
  emptyDone: 'No hay compras agrupadas pagadas.',
  commitment: {
    title: 'Comprometido en cuotas',
    until: 'Comprometido hasta {month}',
    horizonLabel: 'Hasta cuándo',
    horizonOption: '{count} meses',
    committed: 'Valor completo',
    mine: 'Mi parte',
    note: 'Suma de las cuotas aún no pagadas de las tarjetas. El grupo no duplica el valor de las compras.',
    loading: 'Calculando lo comprometido.',
    error: 'No se pudo calcular lo comprometido.',
    retry: 'Intentar de nuevo',
    byMonth: 'Por mes',
  },
  group: {
    interest: 'Con intereses',
    total: 'Total',
    remaining: 'Falta pagar',
    myRemaining: 'Mi parte de lo que falta',
    perMonth: 'Cuotas de este mes',
    endsIn: 'Termina en {month}',
    noPending: 'Sin cuota por vencer',
    done: 'Pagada',
    members: 'Compras del grupo',
    edit: 'Editar',
    link: 'Vincular compra',
    openMembers: 'Ver las compras de {name}',
  },
  member: {
    installments: '{remaining} de {total} cuotas por vencer',
    lastDue: 'Última el {date}',
    unlink: 'Desvincular',
    unlinkAria: 'Desvincular {name} del grupo',
    noDescription: 'Compra sin descripción',
    total: 'Total',
    remaining: 'Falta',
    perInstallment: 'Cuota',
  },
  divergence: {
    title: 'El total informado es distinto',
    text: 'Informaste {declared}, pero las compras suman {computed}. La diferencia es de {difference}.',
    note: 'El total del grupo es siempre la suma de las compras.',
  },
  form: {
    title: 'Nueva compra agrupada',
    editTitle: 'Editar compra agrupada',
    description:
      'Cada compra se vuelve una compra a plazos en la tarjeta. Si ya pagaste una parte, informa cuántas cuotas faltan.',
    name: 'Nombre del artículo',
    interest: 'La compra tiene intereses',
    declaredTotal: 'Total que esperas (opcional)',
    declaredHint: 'Solo sirve para comprobar: el total del grupo es la suma de las compras.',
    members: 'Compras en cada tarjeta',
    memberTitle: 'Compra {number}',
    card: 'Tarjeta',
    installmentAmount: 'Valor de cada cuota',
    totalInstallments: 'Cuotas en total',
    remainingInstallments: 'Cuotas que faltan',
    remainingHint: 'Déjalo igual al total si la compra es nueva.',
    firstInvoiceDate: 'Fecha de la próxima factura a registrar',
    firstInvoiceHint: 'Una fecha dentro del ciclo de la factura de la primera cuota a registrar.',
    addMember: 'Agregar otra tarjeta',
    removeMember: 'Quitar compra {number}',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    toast: 'Compra agrupada creada.',
    toastUpdated: 'Compra agrupada actualizada.',
    noCards: 'Registra una tarjeta para agrupar compras a plazos.',
    addCard: 'Nueva tarjeta',
    editNote:
      'Los valores vienen de las compras del grupo. Aquí solo se puede cambiar el nombre y los intereses.',
  },
  link: {
    title: 'Vincular compra al grupo',
    description: 'Elige una compra a plazos en tarjeta que aún no esté en ningún grupo.',
    search: 'Buscar compra',
    searching: 'Buscando compras.',
    idle: 'Escribe parte de la descripción de la compra.',
    none: 'No se encontró ninguna compra.',
    choose: 'Vincular',
    chooseAria: 'Vincular {name} al grupo',
    close: 'Cerrar',
    toast: 'Compra vinculada.',
    unlinkToast: 'Compra desvinculada.',
  },
};
