import { NextResponse } from 'next/server';
import {
  listSessionIds,
  getSession,
  getRecentWebhookEvents,
  INSTANCE_STARTED_AT,
} from '@/lib/demo/store';

export async function GET() {
  const ids = listSessionIds();
  const sessions = ids.map((id) => {
    const s = getSession(id);
    return s ? {
      id,
      phone: s.phone,
      status: s.status,
      conversationId: s.conversationId,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
    } : null;
  }).filter(Boolean);

  // Configuración mínima del webhook (booleanos + preview de la clave PÚBLICA;
  // jamás secretos). Cada uno es un punto de falla distinto de la cadena
  // demo→panel en vivo.
  const webhookEvents = getRecentWebhookEvents();
  const publicKeyRaw = (process.env.TELNYX_PUBLIC_KEY ?? '').trim();
  const config = {
    // La firma Ed25519 se verifica con esta clave pública: si falta o no
    // coincide con la del portal, TODO webhook muere en 401. El preview deja
    // comparar Render vs Portal sin adivinar: es una clave PÚBLICA, no un
    // secreto — mostrar inicio/fin es seguro y es el diagnóstico más directo.
    publicKeyConfigured: Boolean(publicKeyRaw),
    publicKeyPreview: publicKeyRaw ? `${publicKeyRaw.slice(0, 10)}…${publicKeyRaw.slice(-6)}` : null,
    // Sin API key no se puede enganchar el assistant a la llamada entrante.
    apiKeyConfigured: Boolean(process.env.TELNYX_API_KEY?.trim()),
    // Sin assistant id, la sesión pasa a "live" pero nadie contesta: no hay
    // conversación, no hay transcript, no hay datos.
    assistantIdConfigured: Boolean(process.env.TELNYX_AI_ASSISTANT_ID?.trim()),
  };

  return NextResponse.json({
    total: sessions.length,
    sessions,
    config,
    webhookEvents,
    // Commit exacto que está corriendo (Render inyecta RENDER_GIT_COMMIT).
    // Si no coincide con el último push, el deploy NO se aplicó: revisar la
    // pestaña Deploys de Render (build fallido) o el trigger (Auto Deploy).
    buildCommit: (process.env.RENDER_GIT_COMMIT ?? '').slice(0, 7) || null,
    // El log y las sesiones viven en memoria: si la instancia arrancó hace
    // muy poco, un log vacío puede ser "se perdió en el redeploy", no "el
    // webhook nunca llegó".
    instanceStartedAt: INSTANCE_STARTED_AT,
    uptimeSec: Math.round((Date.now() - INSTANCE_STARTED_AT) / 1000),
    hint: 'Interpreta webhookEvents tras una llamada: (a) vacío = el webhook no llega → URL en Voice > Programmable Voice > tu Voice App (NO la página del número), API Version = v2, número +576019177737 asignado a esa app. (b) "401: sin-header-ed25519" = llega sin firma Ed25519 → la app está en API version V1: cámbiala a v2. (c) "401: firma-no-verifica" = la firma está bien pero no calza con la clave → COPIA la clave pública del portal y reemplaza TELNYX_PUBLIC_KEY en Render; verifica que config.publicKeyPreview CAMBIE (si no cambió, el valor no se actualizó). (d) "401: clave-decodifica-Nbytes" = TELNYX_PUBLIC_KEY no es una clave de 32 bytes. (e) "sesion-live-sin-assistant-id-env" = falta TELNYX_AI_ASSISTANT_ID. (f) "call-initiated-sin-sesion-coincidente" = el número del llamante no coincide con la sesión.',
  });
}