import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { estimateCallCosts } from '@/lib/telnyx/costs';
import { decodeClientState, missingTelnyxCallEnv, missingTelnyxVoiceEnv } from '@/lib/telnyx/client';

// POST /api/voice/webhooks — receptor Call Control v2 (API v2 en tu captura).
// Telnyx firma con Ed25519: cabeceras `telnyx-signature-ed25519` + `telnyx-timestamp`.
// Verificación: libsodium `crypto_sign_verify_detached(timestamp + '|' + rawBody)`.
//
// En tu pantalla del portal (Upway voice core, dominio oficial upway.business):
//   Webhook URL = https://upway.business/api/voice/webhooks
//   Webhook Failover URL = (vacío por ahora)
//   Webhook API Version = API v2  (la que ya marcaste)
//   AnchorSite = Latency (bien para ES-CO si tu cuenta es US; si hay jitter cambia a la región del número)
export const maxDuration = 30;

type TelnyxEvent = {
  data?: {
    event_type?: string;
    /** Momento del evento. Junto a `start_time` del payload da la duración. */
    occurred_at?: string;
    payload?: {
      call_control_id?: string;
      call_leg_id?: string;
      from?: string;
      to?: string;
      client_state?: string;
      /** Inicio de la llamada. Telnyx NO envía un campo de duración. */
      start_time?: string;
      state?: string;
      hangup_cause?: string;
    };
  };
};

/**
 * Minutos de la llamada.
 *
 * AUDITORÍA: el código leía `payload.call_duration_secs`, campo que Telnyx NO
 * envía en `call.hangup`. Como venía `undefined`, TODA llamada se guardaba con
 * 0 minutos: el panel mostraba "minutos de voz" en cero y los costos de la
 * llamada quedaban en 0. No daba error, solo datos falsos.
 *
 * La duración real se obtiene restando `start_time` (payload) de `occurred_at`
 * (sobre del evento), que sí vienen. Se acota a 24h por si vinieran corruptos.
 */
function minutesOfCall(event: TelnyxEvent): number {
  const start = event.data?.payload?.start_time;
  const end = event.data?.occurred_at;
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  const minutes = ms / 60000;
  return minutes > 24 * 60 ? 0 : Math.round(minutes * 100) / 100;
}

/**
 * Dirección de la llamada.
 *
 * AUDITORÍA: se leía `payload.direction`, que Telnyx tampoco envía, así que
 * toda llamada quedaba registrada como 'inbound' —incluidas las salientes que
 * dispara el propio panel.
 *
 * No hay campo de dirección en el payload, así que se deduce: las salientes se
 * crean con `client_state = tienda.id` (ver createOutboundCall), mientras que
 * una entrante llega con el `client_state` de la_numbers application o vacío.
 * Es una inferencia, no un dato del proveedor, y queda dicho aquí para no
 * confundirla con una verdad del API.
 */
async function directionOfCall(clientState: string | null): Promise<'inbound' | 'outbound'> {
  if (!clientState) return 'inbound';
  const tienda = await prisma.tienda.findFirst({ where: { id: clientState }, select: { id: true } });
  return tienda ? 'outbound' : 'inbound';
}

/**
 * Decodifica TELNYX_PUBLIC_KEY tolerando los dos formatos del portal (base64
 * —el típico— y hex de 32 bytes) y el prefijo `TELNYX_PUBLIC_KEY=` que queda
 * cuando se pega la línea completa del .env dentro del valor en Render.
 *
 * AUDITORÍA: el código original hacía `Buffer.from(publicKey, 'hex')` sobre
 * una clave base64 → devolvía 0 bytes → libsodium lanzaba, el catch devolvía
 * false y TODOS los webhooks de voz terminaban en 401 "Firma de voz inválida":
 * LlamadaLog quedaba siempre vacío y la telemetría de llamadas se perdía.
 */
function decodeTelnyxPublicKey(raw: string): Buffer {
  const clean = raw.trim().replace(/^TELNYX_PUBLIC_KEY=/, '');
  const asBase64 = Buffer.from(clean, 'base64');
  if (asBase64.length === 32) return asBase64;
  return Buffer.from(clean, 'hex');
}

async function verifyTelnyx(req: NextRequest, raw: string): Promise<boolean> {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  // Sin public key configurada no podemos verificar: en prod se rechaza.
  if (!publicKey || !signature || !timestamp) return process.env.NODE_ENV !== 'production';
  const key = decodeTelnyxPublicKey(publicKey);
  if (key.length !== 32) {
    console.error('[telnyx] TELNYX_PUBLIC_KEY inválida: se esperaba base64 o hex de 32 bytes.');
    return false;
  }
  try {
    const sodium = await import('libsodium-wrappers');
    await sodium.ready;
    const msg = Buffer.from(`${timestamp}|${raw}`);
    const sig = Buffer.from(signature, 'hex');
    return Boolean(sodium.crypto_sign_verify_detached(sig, msg, key));
  } catch (err) {
    console.error('[telnyx] verify error', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!(await verifyTelnyx(req, raw))) {
    return NextResponse.json({ error: 'Firma de voz inválida' }, { status: 401 });
  }
  let event: TelnyxEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const type = event.data?.event_type ?? 'unknown';
  const p = event.data?.payload ?? {};
  // `client_state` viaja en Base-64: se decodifica para recuperar el tiendaId.
  const tiendaId = decodeClientState(p.client_state);

  // Persistencia en LlamadaLog para telemetría y facturación del centro de mando.
  // Costos reales Telnyx → Upway vía lib/telnyx/costs (persistidos por llamada).
  // Schema real: tiendaId, callSessionId(unique), direction, durationMinutes, costs, status.
  try {
    if (type === 'call.hangup' || type === 'call.hangup.final') {
      if (tiendaId) {
        // Duración calculada de los tiempos reales; antes salía siempre 0
        // porque `call_duration_secs` no existe en el payload de Telnyx.
        const costs = estimateCallCosts(minutesOfCall(event));
        const direction = await directionOfCall(tiendaId);
        const sessionId = p.call_control_id ?? `hangup-${Date.now()}`;
        await prisma.llamadaLog.upsert({
          where: { callSessionId: sessionId },
          update: {
            status: 'completed',
            durationMinutes: costs.durationMinutes,
            telnyxCost: costs.telnyxCost,
            upwayBilledCost: costs.upwayBilledCost,
            callControlId: p.call_control_id ?? null,
          },
          create: {
            tiendaId,
            callSessionId: sessionId,
            callControlId: p.call_control_id ?? null,
            direction,
            durationMinutes: costs.durationMinutes,
            telnyxCost: costs.telnyxCost,
            upwayBilledCost: costs.upwayBilledCost,
            status: 'completed',
          },
        });
      }
    }
    if (type === 'call.initiated' && tiendaId) {
      await prisma.tienda.update({
        where: { id: tiendaId },
        data: { isTelnyxActive: true },
      }).catch(() => undefined);
    }
  } catch (err) {
    console.error('[telnyx] webhook persist failed', err);
  }

  // Responder 200 rápido: Telnyx reintenta si tardas >10s (tu "Custom webhook timeout: 10").
  return NextResponse.json({ received: true, type });
}

// GET de estado. No es verify de Meta: no exige firma.
//
// CONFINIDENCIALIDAD: esta ruta es PÚBLICA (es el destino del webhook entrante),
// así que no puede devolver el nombre del proveedor ni enumerar variables de
// entorno. Responde solo si cada capacidad está lista; el detalle va al log.
// Reporta los DOS gates porque son cosas distintas:
//  - `voice`   → catálogo, preview, clones y assistant
//  - `calling` → marcar una llamada
export async function GET() {
  const voiceMissing = missingTelnyxVoiceEnv();
  const callMissing = missingTelnyxCallEnv();
  if (voiceMissing.length > 0 || callMissing.length > 0) {
    console.error('[telnyx] gate incompleto', { voiceMissing, callMissing });
  }
  return NextResponse.json({
    ok: true,
    webhook: '/api/voice/webhooks',
    voice: { configured: voiceMissing.length === 0 },
    calling: { configured: callMissing.length === 0 },
  });
}
