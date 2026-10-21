importScripts('./ngsw-worker.js');

const PREFS_CACHE = 'moneylog-prefs';
const PREFS_KEY = '/__language';
const DEFAULT_LANGUAGE = 'pt';
const NOTIFICATIONS_URL = '/notifications';
const SECURITY_URL = '/';
const ICON_URL = '/assets/icons/icon-192.png?v=5';
const BADGE_URL = '/assets/icons/badge-96.png?v=5';

const TEXTS = {
  pt: {
    INVOICE_DUE: ['Fatura de cartão', 'Há uma fatura perto do vencimento.'],
    DEBT_COLLECT: ['Dívida a receber', 'Há um recebimento previsto.'],
    DEBT_PAYABLE_DUE: ['Dívida a pagar', 'Há uma dívida perto do vencimento.'],
    RECURRENCE_PENDING: ['Recorrência pendente', 'Há uma recorrência para confirmar.'],
    COMMITTED_NEXT_MONTH: ['Próximo mês', 'Veja seus compromissos do próximo mês.'],
    DAILY_SUMMARY: ['Resumo do dia', 'Abra para ver o resumo do dia.'],
    REMINDER: ['Lembrete', 'Você tem um lembrete.'],
    GOAL_DEADLINE: ['Meta com prazo', 'Uma meta está perto do prazo.'],
    GROUPED: ['Mais avisos', 'Abra para ver todos os avisos.'],
    DEFAULT: ['Nova notificação', 'Abra para ver os detalhes.'],
  },
  en: {
    INVOICE_DUE: ['Card invoice', 'An invoice is close to its due date.'],
    DEBT_COLLECT: ['Debt to collect', 'A payment is expected.'],
    DEBT_PAYABLE_DUE: ['Debt to pay', 'A debt is close to its due date.'],
    RECURRENCE_PENDING: ['Pending recurrence', 'A recurrence needs confirming.'],
    COMMITTED_NEXT_MONTH: ['Next month', 'See your commitments for next month.'],
    DAILY_SUMMARY: ['Daily summary', 'Open to see the daily summary.'],
    REMINDER: ['Reminder', 'You have a reminder.'],
    GOAL_DEADLINE: ['Goal deadline', 'A goal is close to its deadline.'],
    GROUPED: ['More alerts', 'Open to see all alerts.'],
    DEFAULT: ['New notification', 'Open it to see the details.'],
  },
  es: {
    INVOICE_DUE: ['Factura de tarjeta', 'Hay una factura cerca del vencimiento.'],
    DEBT_COLLECT: ['Deuda por cobrar', 'Hay un cobro previsto.'],
    DEBT_PAYABLE_DUE: ['Deuda por pagar', 'Hay una deuda cerca del vencimiento.'],
    RECURRENCE_PENDING: ['Recurrencia pendiente', 'Hay una recurrencia por confirmar.'],
    COMMITTED_NEXT_MONTH: ['Próximo mes', 'Mira tus compromisos del próximo mes.'],
    DAILY_SUMMARY: ['Resumen del día', 'Ábrelo para ver el resumen del día.'],
    REMINDER: ['Recordatorio', 'Tienes un recordatorio.'],
    GOAL_DEADLINE: ['Meta con plazo', 'Una meta está cerca del plazo.'],
    GROUPED: ['Más avisos', 'Ábrelo para ver todos los avisos.'],
    DEFAULT: ['Notificación nueva', 'Ábrela para ver los detalles.'],
  },
};

const SECURITY_TEXTS = {
  pt: {
    login_blocked: [
      'Tentativas de login bloqueadas',
      'Houve muitas tentativas de entrada e o acesso foi bloqueado por um tempo.',
    ],
    new_login: ['Novo acesso', 'Alguém entrou na sua conta a partir de um novo local.'],
    setup_completed: ['Senha definida', 'O primeiro acesso foi concluído.'],
    password_reset: ['Senha redefinida', 'A senha do dono foi redefinida.'],
    quick_token_created: [
      'Novo token de atalho criado',
      'Se não foi você, revogue o token nos ajustes.',
    ],
    quick_token_revoked: [
      'Token de atalho revogado',
      'O atalho que usava esse token parou de funcionar.',
    ],
    quick_token_failure_burst: [
      'Tentativas inválidas de token de atalho',
      'Houve várias tentativas com um token inválido. Se não foi você, revogue o token nos ajustes.',
    ],
    quick_token_new_ip: [
      'Token de atalho usado em novo local',
      'Se não foi você, revogue o token nos ajustes.',
    ],
    DEFAULT: ['Alerta de segurança', 'Abra o app para conferir.'],
  },
  en: {
    login_blocked: [
      'Login attempts blocked',
      'There were too many sign-in attempts and access was blocked for a while.',
    ],
    new_login: ['New sign-in', 'Someone signed in to your account from a new location.'],
    setup_completed: ['Password set', 'The first access was completed.'],
    password_reset: ['Password reset', "The owner's password was reset."],
    quick_token_created: [
      'New shortcut token created',
      "If it wasn't you, revoke the token in settings.",
    ],
    quick_token_revoked: [
      'Shortcut token revoked',
      'The shortcut that used this token stopped working.',
    ],
    quick_token_failure_burst: [
      'Invalid shortcut token attempts',
      "There were several attempts with an invalid token. If it wasn't you, revoke the token in settings.",
    ],
    quick_token_new_ip: [
      'Shortcut token used from a new location',
      "If it wasn't you, revoke the token in settings.",
    ],
    DEFAULT: ['Security alert', 'Open the app to check.'],
  },
  es: {
    login_blocked: [
      'Intentos de acceso bloqueados',
      'Hubo demasiados intentos de entrada y el acceso se bloqueó por un tiempo.',
    ],
    new_login: ['Nuevo acceso', 'Alguien entró en tu cuenta desde un lugar nuevo.'],
    setup_completed: ['Contraseña definida', 'Se completó el primer acceso.'],
    password_reset: ['Contraseña restablecida', 'Se restableció la contraseña del dueño.'],
    quick_token_created: [
      'Nuevo token de atajo creado',
      'Si no fuiste tú, revoca el token en los ajustes.',
    ],
    quick_token_revoked: [
      'Token de atajo revocado',
      'El atajo que usaba este token dejó de funcionar.',
    ],
    quick_token_failure_burst: [
      'Intentos inválidos de token de atajo',
      'Hubo varios intentos con un token inválido. Si no fuiste tú, revoca el token en los ajustes.',
    ],
    quick_token_new_ip: [
      'Token de atajo usado desde un lugar nuevo',
      'Si no fuiste tú, revoca el token en los ajustes.',
    ],
    DEFAULT: ['Alerta de seguridad', 'Abre la app para revisar.'],
  },
};

function securityText(language, payload) {
  const table = SECURITY_TEXTS[language];
  const key =
    typeof payload.titleKey === 'string' && payload.titleKey.startsWith('security.')
      ? payload.titleKey.slice(9)
      : '';
  const [title, body] = Object.prototype.hasOwnProperty.call(table, key)
    ? table[key]
    : table.DEFAULT;
  const ip = payload.params && typeof payload.params.ip === 'string' ? payload.params.ip : '';
  return [title, ip ? body + ' (' + ip + ')' : body];
}

function parsePayload(event) {
  if (!event.data) return null;
  try {
    const payload = event.data.json();
    return payload && typeof payload === 'object' && typeof payload.kind === 'string'
      ? payload
      : null;
  } catch {
    return null;
  }
}

async function storedLanguage() {
  try {
    const cache = await caches.open(PREFS_CACHE);
    const response = await cache.match(PREFS_KEY);
    const value = response ? await response.text() : DEFAULT_LANGUAGE;
    return Object.prototype.hasOwnProperty.call(TEXTS, value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function sourceOrigin(source) {
  try {
    return new URL(source.url).origin;
  } catch {
    return '';
  }
}

self.addEventListener('message', (event) => {
  if (event.origin) {
    if (event.origin !== self.location.origin) return;
  } else if (sourceOrigin(event.source) !== self.location.origin) {
    return;
  }
  const data = event.data;
  if (!data || data.type !== 'LANGUAGE' || typeof data.language !== 'string') return;
  if (!Object.prototype.hasOwnProperty.call(TEXTS, data.language)) return;
  event.waitUntil(
    caches
      .open(PREFS_CACHE)
      .then((cache) => cache.put(PREFS_KEY, new Response(data.language)))
      .catch(() => undefined),
  );
});

self.addEventListener('push', (event) => {
  const payload = parsePayload(event);
  if (!payload) return;
  event.waitUntil(
    storedLanguage().then((language) => {
      const table = TEXTS[language];
      const security = payload.kind === 'SECURITY_ALERT';
      const [title, body] = security
        ? securityText(language, payload)
        : Object.prototype.hasOwnProperty.call(table, payload.kind)
          ? table[payload.kind]
          : table.DEFAULT;
      return self.registration.showNotification(title, {
        body,
        icon: ICON_URL,
        badge: BADGE_URL,
        tag: typeof payload.id === 'string' ? payload.id : undefined,
        data: { url: security ? SECURITY_URL : NOTIFICATIONS_URL },
      });
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  const url = event.notification && event.notification.data && event.notification.data.url;
  if (typeof url !== 'string' || !url.startsWith('/')) return;
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => 'focus' in client);
      if (open) {
        if ('navigate' in open) return open.navigate(url).then((c) => (c || open).focus());
        return open.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
