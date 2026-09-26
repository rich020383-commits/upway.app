/**
 * Cliente Telnyx Call Control v2 + AI Assistants (nativo, sin SDK).
 * Reemplaza a Vapi: Upway opera voz 100% con Telnyx.
 *
 * Env requeridas:
 * - TELNYX_API_KEY (KEY... privada v2, Bearer)
 * - TELNYX_APP_ID (connection_id / Call Control Application ID)
 * - TELNYX_DEFAULT_PHONE_NUMBER (E.164, ej +57300... como `from`)
 * - TELNYX_PUBLIC_KEY (Ed25519, para verificar webhooks)
 * - TELNYX_AI_ASSISTANT_ID (opcional: assistant ya creado en portal)
 * - NEXT_PUBLIC_APP_URL o NEXTAUTH_URL (para construir webhook_url pública)
 */

const TELNYX_BASE = 'https://api.telnyx.com/v2';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[telnyx] Falta ${name} en variables de entorno`);
  return v;
}

export function getTelnyxConfig() {
  return {
    apiKey: process.env.TELNYX_API_KEY ?? '',
    appId: process.env.TELNYX_APP_ID ?? '',
    defaultPhone: process.env.TELNYX_DEFAULT_PHONE_NUMBER ?? '',
    publicKey: process.env.TELNYX_PUBLIC_KEY ?? '',
    assistantId: process.env.TELNYX_AI_ASSISTANT_ID ?? '',
    webhookBase:
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'https://upway.business',
  };
}

/**
 * Env obligatorias POR AMBITO.
 *
 * Antes había una sola lista para todo (`TELNYX_REQUIRED_ENV`) y eso apagaba
 * funciones que no necesitan un número: con `TELNYX_DEFAULT_PHONE_NUMBER`
 * vacía —que es lo normal hasta comprar el DID— el catálogo de voces, el
 * preview de TTS, los clones y el assistant devolvían 503 aunque solo
 * necesiten la API key. En `lib/telnyx/client.ts` se verifica que `appId` y
 * `defaultPhone` SOLO se usan en `createOutboundCall`.
 */

/** Hablar CON la IA: catálogo, preview, clones y assistant. Basta la API key. */
export const TELNYX_VOICE_ENV = ['TELNYX_API_KEY'] as const;

/** MARCAR una llamada: además requiere la Call Control App y un número emisor. */
export const TELNYX_CALL_ENV = [
  'TELNYX_API_KEY',
  'TELNYX_APP_ID',
  'TELNYX_DEFAULT_PHONE_NUMBER',
] as const;

/** Union de ambas, para diagnóstico (el GET de /api/voice/webhooks). */
export const TELNYX_REQUIRED_ENV: readonly string[] = [
  ...new Set([...TELNYX_VOICE_ENV, ...TELNYX_CALL_ENV]),
];

function missingEnv(names: readonly string[]): string[] {
  return names.filter((name) => !(process.env[name] ?? '').trim());
}

/**
 * Devuelve los NOMBRES de las env de voz que faltan (vacías o en blanco).
 * Nunca devuelve valores: es seguro incluirla en mensajes de error 503 y en el
 * GET /api/voice/webhooks para saber exactamente qué falta en Render.
 */
export function missingTelnyxVoiceEnv(): string[] {
  return missingEnv(TELNYX_VOICE_ENV);
}

/** ¿Se puede navegar el catálogo, sintetizar una muestra, clonar y aprovisionar? */
export function isTelnyxVoiceReady(): boolean {
  return missingTelnyxVoiceEnv().length === 0;
}

/**
 * Nombres de las env que faltan para MARCAR una llamada.
 *
 * `from` es el número dedicado de la Tienda. Si la tienda ya tiene uno, la env
 * global deja de ser obligatoria: es el mismo criterio que usa
 * `createOutboundCall` para elegir el `from` (explícito > default global).
 */
export function missingTelnyxCallEnv(from?: string | null): string[] {
  const required = from?.trim()
    ? TELNYX_CALL_ENV.filter((name) => name !== 'TELNYX_DEFAULT_PHONE_NUMBER')
    : TELNYX_CALL_ENV;
  return missingEnv(required);
}

/** ¿Se puede iniciar una llamada saliente? */
export function isTelnyxCallReady(from?: string | null): boolean {
  return missingTelnyxCallEnv(from).length === 0;
}

/**
 * 503 honesto y único para todas las rutas.
 *
 * CONFINIDENCIALIDAD: este texto se muestra al cliente en la tarjeta de voz de
 * Operaciones, así que no puede nombrar al proveedor ni a las variables (los
 * nombres de env lo delatarían). El detalle técnico sí se registra en el log
 * del servidor, que es donde debe estar.
 */
export function telnyxNotReadyMessage(
  missing: string[],
  scope: 'voz' | 'llamada' = 'voz'
): string {
  console.error('[telnyx] configuración incompleta', { scope, missing });
  return scope === 'llamada'
    ? 'La voz de Upway todavía no puede iniciar llamadas: falta terminar de configurar la línea telefónica de la sede.'
    : 'La voz de Upway todavía no está disponible: falta la llave de acceso al servicio de voz.';
}

async function telnyxFetch(path: string, init: RequestInit = {}) {
  const apiKey = requireEnv('TELNYX_API_KEY');
  const res = await fetch(`${TELNYX_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // FormData (clones de voz) debe llevar su propio boundary: no forzar JSON.
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `[telnyx] ${init.method ?? 'GET'} ${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 500)}`
    );
  }
  return data;
}

export type CreateVoiceCallInput = {
  to: string; // E.164 destino, ej +57312...
  from?: string; // número dedicado de la IPS (Tienda.telnyxPhoneNumber) o TELNYX_DEFAULT_PHONE_NUMBER
  webhookUrl?: string; // por defecto {base}/api/voice/webhooks
  assistantId?: string; // AI Assistant a enganchar a la llamada
  clientState?: string; // se devuelve en cada webhook (tiendaId, etc.)
  timeoutSecs?: number;
};

/** Crea una llamada saliente (outbound) con Call Control. */
export async function createOutboundCall(input: CreateVoiceCallInput) {
  const cfg = getTelnyxConfig();
  // Modelo white-glove IPS: cada Tienda tiene su número dedicado.
  // `from` explícito > default global. Nunca inventar número.
  const from = input.from?.trim() || cfg.defaultPhone;
  if (!from) throw new Error('[telnyx] Falta número origen: asigna Tienda.telnyxPhoneNumber o TELNYX_DEFAULT_PHONE_NUMBER');
  const webhookUrl = input.webhookUrl ?? `${cfg.webhookBase}/api/voice/webhooks`;
  return telnyxFetch('/calls', {
    method: 'POST',
    body: JSON.stringify({
      connection_id: cfg.appId,
      to: input.to,
      from,
      webhook_url: webhookUrl,
      webhook_url_method: 'POST',
      timeout_secs: input.timeoutSecs ?? 30,
      client_state: input.clientState ?? '',
      // Si hay assistant configurado, Telnyx lo engancha vía `ai_assistant`:
      ...(input.assistantId ?? cfg.assistantId
        ? { ai_assistant: { id: input.assistantId ?? cfg.assistantId } }
        : {}),
    }),
  });
}

/** Habla texto con TTS en una llamada activa (call_control_id). */
export async function speakOnCall(callControlId: string, payload: string, voice?: string) {
  return telnyxFetch(`/calls/${callControlId}/actions/speak`, {
    method: 'POST',
    body: JSON.stringify({
      payload,
      voice: voice ?? 'Telnyx.female.sofia',
      language: 'es-CO',
    }),
  });
}

/** Cuelga una llamada activa. */
export async function hangupCall(callControlId: string) {
  return telnyxFetch(`/calls/${callControlId}/actions/hangup`, { method: 'POST', body: '{}' });
}

/** Crea/actualiza un AI Assistant de Telnyx para una tienda. */
export async function upsertAssistantForTienda(opts: {
  name: string;
  greeting: string;
  instructions: string;
  voice?: string;
  model?: string;
}) {
  return telnyxFetch('/ai_assistants', {
    method: 'POST',
    body: JSON.stringify({
      name: opts.name.slice(0, 60),
      greeting: opts.greeting.slice(0, 500),
      instructions: opts.instructions.slice(0, 8000),
      voice: opts.voice ?? 'Telnyx.female.sofia',
      model: opts.model ?? 'telnyx-openai-gpt-4o-mini',
      language: 'es',
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Voces: catálogo TTS, previews y clones (panel /health/production)
// Docs: text-to-speech + voice_designs/voice_clones de api.telnyx.com/v2
// ─────────────────────────────────────────────────────────────

export type TelnyxBinary = { contentType: string; bytes: ArrayBuffer };

/** GET /text-to-speech/voices — catálogo de voces de un proveedor. */
export async function listTtsVoices(provider = 'telnyx') {
  return telnyxFetch(`/text-to-speech/voices?provider=${encodeURIComponent(provider)}`);
}

/**
 * POST /text-to-speech/speech — sintetiza texto con una voz (preview del
 * selector). `voice` usa el formato Telnyx.<modelo>.<voz>; devuelve audio
 * binario (audio/mpeg por defecto).
 */
export async function generateSpeech(opts: { voice: string; text: string }): Promise<TelnyxBinary> {
  const apiKey = requireEnv('TELNYX_API_KEY');
  const res = await fetch(`${TELNYX_BASE}/text-to-speech/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice: opts.voice,
      text: opts.text,
      output_type: 'binary_output',
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`[telnyx] POST /text-to-speech/speech -> ${res.status}: ${detail.slice(0, 300)}`);
  }
  return {
    contentType: res.headers.get('content-type') ?? 'audio/mpeg',
    bytes: await res.arrayBuffer(),
  };
}

/** GET /voice_clones — clones de voz de la cuenta (paginado, primeras 100). */
export async function listVoiceClones() {
  return telnyxFetch('/voice_clones?page_size=100');
}

/** POST /voice_designs — crea una voz desde un prompt (Voice Design). */
export async function createVoiceDesign(opts: {
  name: string;
  prompt: string;
  text: string;
  language?: string;
}) {
  return telnyxFetch('/voice_designs', {
    method: 'POST',
    body: JSON.stringify({
      name: opts.name,
      prompt: opts.prompt,
      text: opts.text,
      language: opts.language ?? 'Spanish',
    }),
  });
}

/** POST /voice_clones — captura un diseño de voz como clon utilizable. */
export async function createVoiceCloneFromDesign(opts: {
  voiceDesignId: string;
  name: string;
  language?: string;
  gender?: string;
}) {
  return telnyxFetch('/voice_clones', {
    method: 'POST',
    body: JSON.stringify({
      voice_design_id: opts.voiceDesignId,
      name: opts.name,
      language: opts.language ?? 'es',
      gender: opts.gender ?? 'neutral',
      provider: 'telnyx',
    }),
  });
}

/** POST /voice_clones/from_upload — clon desde muestra de audio (≤5MB, 5–60s). */
export async function createVoiceCloneFromUpload(opts: {
  bytes: ArrayBuffer;
  filename: string;
  contentType: string;
  name: string;
  language?: string;
  gender?: string;
}) {
  const form = new FormData();
  form.append('audio_file', new Blob([opts.bytes], { type: opts.contentType }), opts.filename);
  form.append('name', opts.name);
  form.append('language', opts.language ?? 'es');
  form.append('gender', opts.gender ?? 'neutral');
  form.append('provider', 'telnyx');
  form.append('model_id', 'Qwen3TTS');
  return telnyxFetch('/voice_clones/from_upload', { method: 'POST', body: form });
}

/** GET /voice_clones/{id}/sample — WAV original usado para crear el clon. */
export async function getVoiceCloneSample(cloneId: string): Promise<TelnyxBinary> {
  const apiKey = requireEnv('TELNYX_API_KEY');
  const res = await fetch(`${TELNYX_BASE}/voice_clones/${encodeURIComponent(cloneId)}/sample`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`[telnyx] GET /voice_clones/{id}/sample -> ${res.status}`);
  }
  return {
    contentType: res.headers.get('content-type') ?? 'audio/wav',
    bytes: await res.arrayBuffer(),
  };
}

/**
 * DELETE /voice_clones/{id} — elimina el clon en el proveedor.
 *
 * Es la parte que hace real la revocación: marcar `revokedAt` en la base de
 * datos solo deja de mostrarlo en Upway, pero la voz seguiría existiendo en
 * Telnyx yendo ausable. Por eso el orden correcto es borrar primero en el
 * proveedor y solo después marcar la autorización como revocada: si el borrado
 * falla, la fila sigue viva y el cliente puede reintentar, en vez de registrar
 * una revocación que en realidad no ocurrió.
 */
export async function deleteVoiceClone(cloneId: string) {
  return telnyxFetch(`/voice_clones/${encodeURIComponent(cloneId)}`, { method: 'DELETE' });
}

/** POST /ai/assistants/{id} — aplica la voz elegida al asistente vivo.
 *  Si Telnyx rechaza la actualización, el llamador debe degradar a
 *  "guardado; se aplicará al reprovisionar" (el POST /api/voice/agents
 *  reutiliza Tienda.agentVoice). */
export async function updateAssistantVoice(assistantId: string, voice: string) {
  return telnyxFetch(`/ai/assistants/${encodeURIComponent(assistantId)}`, {
    method: 'POST',
    body: JSON.stringify({ voice_settings: { voice } }),
  });
}
