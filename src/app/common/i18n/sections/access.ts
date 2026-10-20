export interface AccessCopy {
  readonly users: {
    readonly pageTitle: string;
    readonly settingsLink: string;
    readonly description: string;
    readonly backToSettings: string;
    readonly loading: string;
    readonly cancel: string;
    readonly rowActions: string;
    readonly forbidden: { readonly title: string; readonly description: string };
    readonly invite: {
      readonly heading: string;
      readonly emailLabel: string;
      readonly emailHint: string;
      readonly submit: string;
      readonly submitting: string;
      readonly resendExisting: string;
      readonly unavailableTitle: string;
      readonly unavailableDescription: string;
    };
    readonly people: {
      readonly heading: string;
      readonly you: string;
      readonly roles: Readonly<Record<'OWNER' | 'MEMBER', string>>;
      readonly statuses: Readonly<Record<'ACTIVE' | 'DISABLED', string>>;
      readonly lastAccess: string;
      readonly neverAccessed: string;
      readonly onlyYouTitle: string;
      readonly onlyYouDescription: string;
      readonly disable: string;
      readonly enable: string;
      readonly disableConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly toast: { readonly disabled: string; readonly enabled: string };
    };
    readonly invitations: {
      readonly heading: string;
      readonly statuses: Readonly<Record<'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED', string>>;
      readonly validUntil: string;
      readonly expiredAt: string;
      readonly acceptedAt: string;
      readonly revokedHint: string;
      readonly deliveryFailed: string;
      readonly resend: string;
      readonly revoke: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly emptyAction: string;
      readonly revokeConfirm: {
        readonly title: string;
        readonly description: string;
        readonly confirm: string;
      };
      readonly toast: {
        readonly invited: string;
        readonly resent: string;
        readonly revoked: string;
      };
    };
  };
  readonly invitation: {
    readonly pageTitle: string;
    readonly checking: string;
    readonly title: string;
    readonly description: string;
    readonly invitedEmail: string;
    readonly validUntil: string;
    readonly newPassword: string;
    readonly confirmPassword: string;
    readonly show: string;
    readonly hide: string;
    readonly rulesTitle: string;
    readonly ruleLength: string;
    readonly ruleBytes: string;
    readonly ruleNotEmail: string;
    readonly ruleMet: string;
    readonly rulePending: string;
    readonly submit: string;
    readonly submitting: string;
    readonly errors: {
      readonly weakPassword: string;
      readonly rateLimited: string;
      readonly validation: string;
      readonly network: string;
      readonly unavailable: string;
    };
    readonly invalid: {
      readonly title: string;
      readonly description: string;
      readonly goToLogin: string;
    };
    readonly unavailable: {
      readonly title: string;
      readonly description: string;
      readonly rateLimited: string;
      readonly retry: string;
    };
    readonly existingSession: {
      readonly title: string;
      readonly description: string;
      readonly signOutAndUse: string;
      readonly keep: string;
    };
    readonly privacy: {
      readonly title: string;
      readonly paragraphs: readonly string[];
    };
  };
}

export const accessPt: AccessCopy = {
  users: {
    pageTitle: 'Pessoas com acesso',
    settingsLink: 'Pessoas com acesso',
    description:
      'Convide por e-mail quem pode usar o Monelog. Cada pessoa vê só os próprios dados. Você enxerga apenas e-mail, papel, status e datas.',
    backToSettings: 'Voltar aos ajustes',
    loading: 'Carregando pessoas e convites…',
    cancel: 'Cancelar',
    rowActions: 'Ações para {email}',
    forbidden: {
      title: 'Você não tem acesso a esta área',
      description: 'Só quem administra o Monelog gerencia pessoas e convites.',
    },
    invite: {
      heading: 'Convidar alguém',
      emailLabel: 'E-mail da pessoa',
      emailHint: 'Enviamos um link que vale por 7 dias.',
      submit: 'Enviar convite',
      submitting: 'Enviando…',
      resendExisting: 'Reenviar o convite existente',
      unavailableTitle: 'Convites indisponíveis no momento',
      unavailableDescription:
        'Não é possível enviar convites agora. Quem já tem acesso continua entrando normalmente.',
    },
    people: {
      heading: 'Pessoas',
      you: 'Você',
      roles: { OWNER: 'Dono', MEMBER: 'Convidado' },
      statuses: { ACTIVE: 'Ativo', DISABLED: 'Desativado' },
      lastAccess: 'Último acesso em {when}',
      neverAccessed: 'Ainda não entrou',
      onlyYouTitle: 'Só você tem acesso por enquanto',
      onlyYouDescription: 'Quando alguém aceitar um convite, a pessoa aparece aqui.',
      disable: 'Desativar',
      enable: 'Reativar',
      disableConfirm: {
        title: 'Desativar o acesso de {email}?',
        description:
          'A pessoa deixa de entrar e as sessões abertas são encerradas. Os dados dela são mantidos e você pode reativar depois.',
        confirm: 'Desativar acesso',
      },
      toast: {
        disabled: 'Acesso de {email} desativado.',
        enabled: 'Acesso de {email} reativado.',
      },
    },
    invitations: {
      heading: 'Convites',
      statuses: {
        PENDING: 'Aguardando',
        ACCEPTED: 'Aceito',
        EXPIRED: 'Expirado',
        REVOKED: 'Revogado',
      },
      validUntil: 'Válido até {when}',
      expiredAt: 'Expirou em {when}',
      acceptedAt: 'Aceito em {when}',
      revokedHint: 'O link deste convite não funciona mais.',
      deliveryFailed: 'Não conseguimos enviar o e-mail deste convite. Reenvie para tentar de novo.',
      resend: 'Reenviar',
      revoke: 'Revogar',
      emptyTitle: 'Nenhum convite por aqui',
      emptyDescription: 'Convide alguém pelo e-mail para dar acesso ao Monelog.',
      emptyAction: 'Convidar alguém',
      revokeConfirm: {
        title: 'Revogar o convite para {email}?',
        description: 'O link enviado deixa de funcionar. Essa ação não pode ser desfeita.',
        confirm: 'Revogar convite',
      },
      toast: {
        invited: 'Convite enviado para {email}.',
        resent: 'Convite reenviado para {email}.',
        revoked: 'Convite para {email} revogado.',
      },
    },
  },
  invitation: {
    pageTitle: 'Convite',
    checking: 'Verificando o convite…',
    title: 'Você foi convidado',
    description: 'Crie uma senha para entrar no Monelog.',
    invitedEmail: 'Convite para {email}',
    validUntil: 'Válido até {when}',
    newPassword: 'Senha',
    confirmPassword: 'Repetir a senha',
    show: 'Mostrar',
    hide: 'Ocultar',
    rulesTitle: 'Sua senha precisa ter',
    ruleLength: '12 caracteres ou mais',
    ruleBytes: 'No máximo 72 bytes',
    ruleNotEmail: 'Ser diferente do e-mail',
    ruleMet: 'Atendida',
    rulePending: 'Pendente',
    submit: 'Criar senha e entrar',
    submitting: 'Criando…',
    errors: {
      weakPassword:
        'Essa senha não foi aceita. Use 12 caracteres ou mais, no máximo 72 bytes e diferente do e-mail. O convite continua válido.',
      rateLimited: 'Muitas tentativas. Tente de novo em cerca de {minutes} min.',
      validation: 'Revise a senha e tente de novo.',
      network: 'Sem conexão. Verifique a internet e tente de novo. O que você digitou foi mantido.',
      unavailable: 'Não foi possível concluir agora. Tente de novo em instantes.',
    },
    invalid: {
      title: 'Este convite não é mais válido',
      description: 'Abra o link do e-mail novamente ou peça outro convite ao dono do Monelog.',
      goToLogin: 'Ir para a entrada',
    },
    unavailable: {
      title: 'Não conseguimos verificar agora',
      description: 'Seu convite continua guardado nesta tela. Verifique a conexão e tente de novo.',
      rateLimited: 'Muitas tentativas. Tente de novo em cerca de {minutes} min.',
      retry: 'Tentar de novo',
    },
    existingSession: {
      title: 'Você já está com uma conta aberta neste aparelho',
      description:
        'Para usar este convite, saia da conta atual. Se preferir, continue com ela e o convite será descartado.',
      signOutAndUse: 'Sair e usar o convite',
      keep: 'Continuar com a conta atual',
    },
    privacy: { title: 'Privacidade', paragraphs: [] },
  },
};

export const accessEn: AccessCopy = {
  users: {
    pageTitle: 'People with access',
    settingsLink: 'People with access',
    description:
      'Invite by email who can use Monelog. Each person sees only their own data. You only see email, role, status and dates.',
    backToSettings: 'Back to settings',
    loading: 'Loading people and invitations…',
    cancel: 'Cancel',
    rowActions: 'Actions for {email}',
    forbidden: {
      title: 'You do not have access to this area',
      description: 'Only whoever administers Monelog manages people and invitations.',
    },
    invite: {
      heading: 'Invite someone',
      emailLabel: 'Their email',
      emailHint: 'We send a link that is valid for 7 days.',
      submit: 'Send invitation',
      submitting: 'Sending…',
      resendExisting: 'Resend the existing invitation',
      unavailableTitle: 'Invitations are unavailable right now',
      unavailableDescription:
        'Invitations cannot be sent at the moment. People who already have access can keep signing in.',
    },
    people: {
      heading: 'People',
      you: 'You',
      roles: { OWNER: 'Owner', MEMBER: 'Guest' },
      statuses: { ACTIVE: 'Active', DISABLED: 'Disabled' },
      lastAccess: 'Last access on {when}',
      neverAccessed: 'Has not signed in yet',
      onlyYouTitle: 'Only you have access for now',
      onlyYouDescription: 'When someone accepts an invitation, they show up here.',
      disable: 'Disable',
      enable: 'Re-enable',
      disableConfirm: {
        title: 'Disable access for {email}?',
        description:
          'They can no longer sign in and open sessions end. Their data is kept and you can re-enable access later.',
        confirm: 'Disable access',
      },
      toast: {
        disabled: 'Access for {email} disabled.',
        enabled: 'Access for {email} re-enabled.',
      },
    },
    invitations: {
      heading: 'Invitations',
      statuses: {
        PENDING: 'Waiting',
        ACCEPTED: 'Accepted',
        EXPIRED: 'Expired',
        REVOKED: 'Revoked',
      },
      validUntil: 'Valid until {when}',
      expiredAt: 'Expired on {when}',
      acceptedAt: 'Accepted on {when}',
      revokedHint: 'The link in this invitation no longer works.',
      deliveryFailed: 'We could not send the email for this invitation. Resend to try again.',
      resend: 'Resend',
      revoke: 'Revoke',
      emptyTitle: 'No invitations here',
      emptyDescription: 'Invite someone by email to give them access to Monelog.',
      emptyAction: 'Invite someone',
      revokeConfirm: {
        title: 'Revoke the invitation for {email}?',
        description: 'The link that was sent stops working. This cannot be undone.',
        confirm: 'Revoke invitation',
      },
      toast: {
        invited: 'Invitation sent to {email}.',
        resent: 'Invitation resent to {email}.',
        revoked: 'Invitation for {email} revoked.',
      },
    },
  },
  invitation: {
    pageTitle: 'Invitation',
    checking: 'Checking the invitation…',
    title: 'You were invited',
    description: 'Create a password to sign in to Monelog.',
    invitedEmail: 'Invitation for {email}',
    validUntil: 'Valid until {when}',
    newPassword: 'Password',
    confirmPassword: 'Repeat the password',
    show: 'Show',
    hide: 'Hide',
    rulesTitle: 'Your password needs',
    ruleLength: '12 characters or more',
    ruleBytes: 'At most 72 bytes',
    ruleNotEmail: 'To differ from the email',
    ruleMet: 'Met',
    rulePending: 'Pending',
    submit: 'Create password and sign in',
    submitting: 'Creating…',
    errors: {
      weakPassword:
        'That password was not accepted. Use 12 characters or more, at most 72 bytes and different from the email. The invitation is still valid.',
      rateLimited: 'Too many attempts. Try again in about {minutes} min.',
      validation: 'Review the password and try again.',
      network: 'No connection. Check the internet and try again. What you typed was kept.',
      unavailable: 'We could not finish right now. Try again in a moment.',
    },
    invalid: {
      title: 'This invitation is no longer valid',
      description:
        'Open the link in the email again or ask the Monelog owner for another invitation.',
      goToLogin: 'Go to sign in',
    },
    unavailable: {
      title: 'We cannot check right now',
      description:
        'Your invitation is still kept on this screen. Check the connection and try again.',
      rateLimited: 'Too many attempts. Try again in about {minutes} min.',
      retry: 'Try again',
    },
    existingSession: {
      title: 'You already have an account open on this device',
      description:
        'To use this invitation, sign out of the current account. If you prefer, keep using it and the invitation is discarded.',
      signOutAndUse: 'Sign out and use the invitation',
      keep: 'Keep the current account',
    },
    privacy: { title: 'Privacy', paragraphs: [] },
  },
};

export const accessEs: AccessCopy = {
  users: {
    pageTitle: 'Personas con acceso',
    settingsLink: 'Personas con acceso',
    description:
      'Invita por correo a quien puede usar Monelog. Cada persona ve solo sus propios datos. Tú solo ves correo, rol, estado y fechas.',
    backToSettings: 'Volver a ajustes',
    loading: 'Cargando personas e invitaciones…',
    cancel: 'Cancelar',
    rowActions: 'Acciones para {email}',
    forbidden: {
      title: 'No tienes acceso a esta área',
      description: 'Solo quien administra Monelog gestiona personas e invitaciones.',
    },
    invite: {
      heading: 'Invitar a alguien',
      emailLabel: 'Correo de la persona',
      emailHint: 'Enviamos un enlace que vale por 7 días.',
      submit: 'Enviar invitación',
      submitting: 'Enviando…',
      resendExisting: 'Reenviar la invitación existente',
      unavailableTitle: 'Invitaciones no disponibles por ahora',
      unavailableDescription:
        'No es posible enviar invitaciones en este momento. Quien ya tiene acceso sigue entrando con normalidad.',
    },
    people: {
      heading: 'Personas',
      you: 'Tú',
      roles: { OWNER: 'Dueño', MEMBER: 'Invitado' },
      statuses: { ACTIVE: 'Activo', DISABLED: 'Desactivado' },
      lastAccess: 'Último acceso el {when}',
      neverAccessed: 'Aún no ha entrado',
      onlyYouTitle: 'Por ahora solo tú tienes acceso',
      onlyYouDescription: 'Cuando alguien acepte una invitación, aparecerá aquí.',
      disable: 'Desactivar',
      enable: 'Reactivar',
      disableConfirm: {
        title: '¿Desactivar el acceso de {email}?',
        description:
          'La persona deja de entrar y las sesiones abiertas se cierran. Sus datos se mantienen y puedes reactivar el acceso después.',
        confirm: 'Desactivar acceso',
      },
      toast: {
        disabled: 'Acceso de {email} desactivado.',
        enabled: 'Acceso de {email} reactivado.',
      },
    },
    invitations: {
      heading: 'Invitaciones',
      statuses: {
        PENDING: 'En espera',
        ACCEPTED: 'Aceptada',
        EXPIRED: 'Vencida',
        REVOKED: 'Revocada',
      },
      validUntil: 'Válida hasta el {when}',
      expiredAt: 'Venció el {when}',
      acceptedAt: 'Aceptada el {when}',
      revokedHint: 'El enlace de esta invitación ya no funciona.',
      deliveryFailed:
        'No pudimos enviar el correo de esta invitación. Reenvíala para intentar de nuevo.',
      resend: 'Reenviar',
      revoke: 'Revocar',
      emptyTitle: 'Ninguna invitación por aquí',
      emptyDescription: 'Invita a alguien por correo para darle acceso a Monelog.',
      emptyAction: 'Invitar a alguien',
      revokeConfirm: {
        title: '¿Revocar la invitación para {email}?',
        description: 'El enlace enviado deja de funcionar. Esta acción no se puede deshacer.',
        confirm: 'Revocar invitación',
      },
      toast: {
        invited: 'Invitación enviada a {email}.',
        resent: 'Invitación reenviada a {email}.',
        revoked: 'Invitación para {email} revocada.',
      },
    },
  },
  invitation: {
    pageTitle: 'Invitación',
    checking: 'Verificando la invitación…',
    title: 'Te invitaron',
    description: 'Crea una contraseña para entrar en Monelog.',
    invitedEmail: 'Invitación para {email}',
    validUntil: 'Válida hasta el {when}',
    newPassword: 'Contraseña',
    confirmPassword: 'Repite la contraseña',
    show: 'Mostrar',
    hide: 'Ocultar',
    rulesTitle: 'Tu contraseña necesita',
    ruleLength: '12 caracteres o más',
    ruleBytes: 'Como máximo 72 bytes',
    ruleNotEmail: 'Ser distinta del correo',
    ruleMet: 'Cumplida',
    rulePending: 'Pendiente',
    submit: 'Crear contraseña y entrar',
    submitting: 'Creando…',
    errors: {
      weakPassword:
        'Esa contraseña no fue aceptada. Usa 12 caracteres o más, como máximo 72 bytes y distinta del correo. La invitación sigue siendo válida.',
      rateLimited: 'Demasiados intentos. Prueba de nuevo en unos {minutes} min.',
      validation: 'Revisa la contraseña e intenta de nuevo.',
      network: 'Sin conexión. Revisa internet e intenta de nuevo. Lo que escribiste se mantuvo.',
      unavailable: 'No pudimos terminar ahora. Intenta de nuevo en un momento.',
    },
    invalid: {
      title: 'Esta invitación ya no es válida',
      description: 'Abre el enlace del correo otra vez o pide otra invitación al dueño de Monelog.',
      goToLogin: 'Ir a la entrada',
    },
    unavailable: {
      title: 'No podemos verificar ahora',
      description:
        'Tu invitación sigue guardada en esta pantalla. Revisa la conexión e intenta de nuevo.',
      rateLimited: 'Demasiados intentos. Prueba de nuevo en unos {minutes} min.',
      retry: 'Intentar de nuevo',
    },
    existingSession: {
      title: 'Ya tienes una cuenta abierta en este dispositivo',
      description:
        'Para usar esta invitación, cierra la sesión de la cuenta actual. Si prefieres, sigue con ella y la invitación se descarta.',
      signOutAndUse: 'Salir y usar la invitación',
      keep: 'Seguir con la cuenta actual',
    },
    privacy: { title: 'Privacidad', paragraphs: [] },
  },
};
