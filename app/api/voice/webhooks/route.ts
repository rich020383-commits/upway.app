import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { estimateCallCosts } from '@/lib/telnyx/costs';
import { missingTelnyxCallEnv, missingTelnyxVoiceEnv } from '@/lib/telnyx/client';

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
    payload?: {
      call_control_id?: string;
      call_leg_id?: string;
      from?: string;
      to?: string;
      direction?: string;
      client_state?: string;
      call_duration_secs?: number;
    };
  };
};

async function verifyTelnyx(req: NextRequest, raw: string): Promise<boolean> {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  // Sin public key configurada no podemos verificar: en prod se rechaza.
  if (!publicKey || !signature || !timestamp) return process.env.NODE_ENV !== 'production';
  try {
    const sodium = await import('libsodium-wrappers');
    await sodium.ready;
    const msg = Buffer.from(`${timestamp}|${raw}`);
    const sig = Buffer.from(signature, 'hex');
    const key = Buffer.from(publicKey, 'hex');
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
  const tiendaId = (p.client_state ?? '').slice(0, 64) || null;

  // Persistencia en LlamadaLog para telemetría y facturación del centro de mando.
  // Costos reales Telnyx → Upway vía lib/telnyx/costs (persistidos por llamada).
  // Schema real: tiendaId, callSessionId(unique), direction, durationMinutes, costs, status.
  try {
    if (type === 'call.hangup' || type === 'call.hangup.final') {
      if (tiendaId) {
        const costs = estimateCallCosts((p.call_duration_secs ?? 0) / 60);
        await prisma.llamadaLog.upsert({
          where: { callSessionId: p.call_control_id ?? `hangup-${Date.now()}` },
          update: {
            status: 'completed',
            durationMinutes: costs.durationMinutes,
            telnyxCost: costs.telnyxCost,
            upwayBilledCost: costs.upwayBilledCost,
            callControlId: p.call_control_id ?? null,
          },
          create: {
            tiendaId,
            callSessionId: p.call_control_id ?? `hangup-${Date.now()}`,
            callControlId: p.call_control_id ?? null,
            direction: p.direction ?? 'inbound',
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
