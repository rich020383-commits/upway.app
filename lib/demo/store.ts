/**
 * Sesiones de la demo en vivo (/demo).
 *
 * Flujo: el visitante registra su celular → llama al número demo → el webhook
 * de voz empareja la llamada por el número del llamante → el panel SSE muestra
 * el transcript y los datos que la asistente va capturando en tiempo real.
 *
 * PRIVACIDAD: el transcript de la demo solo es visible con el id aleatorio de
 * la sesión (UUID). El teléfono viaja enmascarado en los snapshots públicos.
 *
 * LIMITACIÓN CONOCIDA Y ACEPTADA (mismo criterio que lib/rate-limit.ts): el
 * estado vive en la memoria del proceso. En un despliegue multi-instancia la
 * sesión creada en una instancia no existe en otra y el webhook podría caer en
 * un proceso distinto al del SSE. El despliegue actual (Render, una instancia)
 * no tiene ese problema. Para escalar: Redis o Postgres como bus compartido.
 */

import { getConversationMessages } from '@/lib/telnyx/client';

/** Turno normalizado del transcript (común a API GET y webhook de cierre). */
export type DemoMessage = {
  role: 'user' | 'assistant' | 'tool';
  text: string;
  at?: string | null;
};

export type DemoSessionStatus = 'waiting' | 'live' | 'ended';

export type DemoSession = {
  id: string;
  /** E.164 normalizado del visitante, ej. +573126427856. */
  phone: string;
  /** Nombre del visitante (opcional, desde el formulario de la landing). */
  nombre: string | null;
  /** Institución/empresa del visitante (opcional, desde el formulario de la landing). */
  institucion: string | null;
  createdAt: number;
  status: DemoSessionStatus;
  /** id de la conversación del asistente (call.conversation.created). */
  conversationId: string | null;
  messages: DemoMessage[];
  /** Duración reportada al colgar (call.conversation.ended). */
  durationSec: number | null;
};

/** Las sesiones caducan a los 30 minutos: una demo no es una cuenta. */
const SESSION_TTL_MS = 30 * 60 * 1000;
/** Tope defensivo de sesiones en memoria (no crecer sin limite). */
const MAX_SESSIONS = 500;
/** Cadencia del polling del transcript mientras la llamada está viva. */
const POLL_MS = 2000;

type Listener = (session: DemoSession) => void;

const sessions = new Map<string, DemoSession>();
const listeners = new Map<string, Set<Listener>>();
/** Pollers activos por id de sesión; se limpian al colgar o caducar. */
const pollers = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Normaliza un número colombiano a E.164 (+57 + 10 dígitos).
 * Acepta "+57 312 642 7856", "573126427856", "3126427856", "03126427856".
 * Devuelve null si no es un número colombiano válido.
 */
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  // Quitar prefijo internacional 00 y el 0 de larga distancia nacional.
  const sinPrefijo = digits.replace(/^00/, '').replace(/^0(?=\d{10}$)/, '');
  const nacional = sinPrefijo.replace(/^57(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(nacional)) return null;
  // Móviles colombianos empiezan en 3; también se aceptan fijos (área + número).
  return `+57${nacional}`;
}

/** Enmascara el teléfono para el snapshot público: "+57 3•• ••• 7856". */
export function maskPhone(e164: string): string {
  const n = e164.replace('+57', '');
  return `+57 ${n.slice(0, 1)}•• ••• ${n.slice(-3)}`;
}

/**
 * Normaliza los mensajes del GET /ai/conversations/{id}/messages.
 * Los tool calls vienen como assistant con `tool_calls` y texto vacío: se
 * convierten en un turno visible con el nombre de la herramienta, para que el
 * panel muestre "Sophie ejecutó: book_appointment" en vez de una burbuja muda.
 */
export function normalizeApiMessages(raw: unknown): DemoMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: DemoMessage[] = [];
  for (const m of raw as Array<Record<string, unknown>>) {
    const role = m.role === 'user' || m.role === 'assistant' || m.tool_calls ? m.role : 'assistant';
    const texto = typeof m.text === 'string' ? m.text.trim() : '';
    if (texto) {
      out.push({ role: (role as DemoMessage['role']) ?? 'assistant', text: texto, at: (m.sent_at as string) ?? (m.created_at as string) ?? null });
      continue;
    }
    const calls = Array.isArray(m.tool_calls) ? (m.tool_calls as Array<{ function?: { name?: string } }>) : [];
    for (const call of calls) {
      const nombre = call?.function?.name;
      if (nombre) out.push({ role: 'tool', text: nombre, at: (m.sent_at as string) ?? null });
    }
  }
  return out;
}

/**
 * Normaliza los mensajes del webhook call.conversation.ended.
 * Allí el campo es `content` (no `text`) y el timestamp es `timestamp`.
 */
export function normalizeEndedMessages(raw: unknown): DemoMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: DemoMessage[] = [];
  for (const m of raw as Array<Record<string, unknown>>) {
    const role = m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'tool';
    const texto = typeof m.content === 'string' ? m.content.trim() : '';
    if (!texto) continue;
    out.push({ role, text: texto, at: (m.timestamp as string) ?? null });
  }
  return out;
}

/** Crea una sesión de demo para un número de visitante. */
export function createSession(phone: string, nombre?: string | null, institucion?: string | null): DemoSession {
  const normalizado = normalizePhone(phone);
  if (!normalizado) {
    throw new Error(`Número de teléfono inválido para sesión de demo: ${phone}`);
  }
  if (sessions.size >= MAX_SESSIONS) {
    const ahora = Date.now();
    let masViejo: string | null = null;
    let tsMasViejo = ahora;
    for (const [id, s] of sessions) {
      const ts = s.createdAt;
      if (ts < tsMasViejo) {
        tsMasViejo = ts;
        masViejo = id;
      }
    }
    if (masViejo) {
      stopPollers(masViejo);
      sessions.delete(masViejo);
      listeners.delete(masViejo);
    }
  }
  const id = crypto.randomUUID();
  const sesion: DemoSession = {
    id,
    phone: normalizado,
    nombre: nombre ?? null,
    institucion: institucion ?? null,
    createdAt: Date.now(),
    status: 'waiting',
    conversationId: null,
    messages: [],
    durationSec: null,
  };
  sessions.set(id, sesion);
  listeners.set(id, new Set());
  return sesion;
}

/** Obtiene una sesión por id (o null). */
export function getSession(id: string): DemoSession | null {
  return sessions.get(id) ?? null;
}

/** Asocia una llamada Telnyx a una sesión de demo. */
export function associateCall(
  id: string,
  callControlId: string,
  conversationId: string | null,
): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.conversationId = conversationId ?? s.conversationId;
  if (conversationId) s.status = 'live';
  notify(id, s);
  return s;
}

/** Añade un mensaje al transcript y notifica a los escuchas SSE. */
export function addMessage(id: string, message: DemoMessage): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.messages.push(message);
  notify(id, s);
  return s;
}

/** Reemplaza el transcript completo (usado por el polling). */
export function setMessages(id: string, messages: DemoMessage[]): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.messages = messages;
  notify(id, s);
  return s;
}

export function setStatus(id: string, status: DemoSessionStatus): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.status = status;
  notify(id, s);
  return s;
}

export function setDuration(id: string, secs: number): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.durationSec = secs;
  notify(id, s);
  return s;
}

/** Snapshot público: teléfono enmascarado, nunca el número completo. */
export function getPublicSnapshot(id: string): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  return { ...s, phone: maskPhone(s.phone) };
}

/** Lista ids de sesiones activas (para diagnóstico interno). */
export function listSessionIds(): string[] {
  return Array.from(sessions.keys());
}

/* ==========================================================================
 * LOG DE EVENTOS DE WEBHOOK (diagnóstico /demo/diagnostic)
 * --------------------------------------------------------------------------
 * La cadena de la demo tiene varios puntos de falla silenciosos: el webhook
 * no llega, la firma se rechaza (401), el número no coincide o falta el
 * assistant. Sin rastro, todo se ve igual "sesión stuck en waiting". Este
 * buffer guarda los últimos eventos vistos (tipo + resultado + sesión
 * emparejada, teléfono SIEMPRE enmascarado) para que el diagnóstico diga
 * exactamente en qué paso se rompe la cadena. Es el mismo criterio de vida
 * en memoria que las sesiones: se pierde al reiniciar el proceso.
 * ========================================================================== */

export type WebhookEventLog = {
  /** Momento en milisegundos (Date.now()). */
  at: number;
  /** event_type de Telnyx o 'unknown' si la firma se rechazó antes de parsear. */
  type: string;
  /** Teléfono del llamante enmascarado (nunca completo). */
  fromMasked: string | null;
  /** Resultado del procesamiento. */
  outcome: string;
  /** Id corto de la sesión emparejada, si hubo. */
  sid: string | null;
};

/** Tope del buffer circular de eventos. */
const WEBHOOK_LOG_MAX = 50;
const webhookEvents: WebhookEventLog[] = [];

/**
 * Momento en que este proceso cargó el módulo (Date.now()).
 * El log y las sesiones viven en memoria: si Render reinicia el proceso, se
 * pierden. Este timestamp permite saber en el diagnóstico si un log vacío
 * significa "el webhook nunca llegó" o "la instancia se reinició hace un
 * segundo y los eventos previos se perdieron".
 */
export const INSTANCE_STARTED_AT = Date.now();

/** Registra un evento de webhook visto (para el diagnóstico público). */
export function logWebhookEvent(e: Omit<WebhookEventLog, 'at'>): void {
  webhookEvents.unshift({ ...e, at: Date.now() });
  if (webhookEvents.length > WEBHOOK_LOG_MAX) webhookEvents.length = WEBHOOK_LOG_MAX;
}

/** Últimos eventos de webhook, del más reciente al más antiguo. */
export function getRecentWebhookEvents(): WebhookEventLog[] {
  return [...webhookEvents];
}

type PollerState = { timer: ReturnType<typeof setInterval>; lastMessageCount: number };

/** Inicia polling del transcript de Telnyx cada POLL_MS mientras la llamada viva. */
export function startPolling(id: string): void {
  if (pollers.has(id)) return;
  const s = sessions.get(id);
  const convId = s?.conversationId;
  if (!convId) return;

  const state: PollerState = {
    timer: setInterval(async () => {
      const ses = sessions.get(id);
      if (!ses || ses.status === 'ended') {
        stopPollers(id);
        return;
      }
      try {
        const data = await getConversationMessages(convId);
        const msgs = normalizeApiMessages(data?.data ?? []);
        if (msgs.length !== state.lastMessageCount) {
          state.lastMessageCount = msgs.length;
          setMessages(id, msgs);
        }
      } catch (err) {
        console.warn('[demo] polling falló', id, err);
      }
    }, POLL_MS),
    lastMessageCount: 0,
  };
  pollers.set(id, state.timer);
}

/** Detiene el polling de una sesión. */
export function stopPollers(id: string): void {
  const timer = pollers.get(id);
  if (timer) {
    clearInterval(timer);
    pollers.delete(id);
  }
}

/** Suscribe un listener (SSE) a una sesión. Devuelve fn de des-suscripción. */
export function subscribe(id: string, listener: Listener): () => void {
  const set = listeners.get(id);
  if (!set) return () => {};
  set.add(listener);
  const s = sessions.get(id);
  if (s) listener(s);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      const ses = sessions.get(id);
      if (ses && ses.status === 'ended') {
        stopPollers(id);
        sessions.delete(id);
        listeners.delete(id);
      }
    }
  };
}

function notify(id: string, session: DemoSession): void {
  const set = listeners.get(id);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(session);
    } catch {
      // Un listener roto no debe caer el webhook.
    }
  }
}

/** Elimina sesiones expiradas (llamar periódicamente o al crear). */
export function cleanupExpired(): number {
  const ahora = Date.now();
  let borradas = 0;
  for (const [id, s] of sessions) {
    if (ahora - s.createdAt > SESSION_TTL_MS) {
      stopPollers(id);
      sessions.delete(id);
      listeners.delete(id);
      borradas++;
    }
  }
  return borradas;
}

/** Fuerza el fin de una sesión (llamar desde webhook de hangup/ended). */
export function endSession(id: string): DemoSession | null {
  const s = sessions.get(id);
  if (!s) return null;
  s.status = 'ended';
  stopPollers(id);
  notify(id, s);
  return s;
}
