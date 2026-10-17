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
    // El log y las sesiones viven en memoria: si la instancia arrancó hace
    // muy poco, un log vacío puede ser "se perdió en el redeploy", no "el
    // webhook nunca llegó".
    instanceStartedAt: INSTANCE_STARTED_AT,
    uptimeSec: Math.round((Date.now() - INSTANCE_STARTED_AT) / 1000),
    hint: 'Si "webhookEvents" está vacío tras una llamada: el webhook de Telnyx no llega (verifica en el portal: Voice > Programmable Voice > tu Voice App — NO en la página del número — "Send a webhook to the URL" = https://upway.business/api/voice/webhooks, API Version v2; y el número +576019177737 debe estar asignado a esa app). Si ves "firma-rechazada-401": TELNYX_PUBLIC_KEY en Render no coincide con la del portal. Si ves "sesion-live-sin-assistant-id-env": falta TELNYX_AI_ASSISTANT_ID en Render (nadie contesta la llamada). Si ves "call-initiated-sin-sesion-coincidente": el número del llamante no coincide con el de la sesión.',
  });
}