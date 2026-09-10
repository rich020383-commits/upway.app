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

export function isTelnyxConfigured(): boolean {
  const c = getTelnyxConfig();
  return Boolean(c.apiKey && c.appId && c.defaultPhone);
}

async function telnyxFetch(path: string, init: RequestInit = {}) {
  const apiKey = requireEnv('TELNYX_API_KEY');
  const res = await fetch(`${TELNYX_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
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
  from?: string; // por defecto TELNYX_DEFAULT_PHONE_NUMBER
  webhookUrl?: string; // por defecto {base}/api/voice/webhooks
  assistantId?: string; // AI Assistant a enganchar a la llamada
  clientState?: string; // se devuelve en cada webhook (tiendaId, etc.)
  timeoutSecs?: number;
};

/** Crea una llamada saliente (outbound) con Call Control. */
export async function createOutboundCall(input: CreateVoiceCallInput) {
  const cfg = getTelnyxConfig();
  const webhookUrl = input.webhookUrl ?? `${cfg.webhookBase}/api/voice/webhooks`;
  return telnyxFetch('/calls', {
    method: 'POST',
    body: JSON.stringify({
      connection_id: cfg.appId,
      to: input.to,
      from: input.from ?? cfg.defaultPhone,
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
