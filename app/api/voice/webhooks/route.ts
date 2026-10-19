import { NextRequest, NextResponse } from 'next/server';
import { createPublicKey, verify as verificarEd25519 } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { estimateCallCosts } from '@/lib/telnyx/costs';
import {
  decodeClientState,
  getTelnyxConfig,
  missingTelnyxCallEnv,
  missingTelnyxVoiceEnv,
  startAssistantOnCall,
} from '@/lib/telnyx/client';
import {
  associateCall,
  createSession,
  endSession,
  getPublicSnapshot,
  getSession,
  listSessionIds,
  logWebhookEvent,
  normalizePhone,
  setDuration,
  setMessages,
  setStatus,
  startPolling,
} from '@/lib/demo/store';
import { extractLeadData } from '@/lib/demo/extract';
import { maskPhone } from '@/lib/demo/store';

// POST /api/voice/webhooks — receptor Call Control v2 (API v2 en tu captura).
// Firma Ed25519: cabeceras `telnyx-signature-ed25519` (BASE64, como decodifica
// el SDK oficial) + `telnyx-timestamp`.
// Verificación: node:crypto nativo sobre `timestamp + '|' + rawBody`.
// ANTES usaba libsodium vía `await import()` dinámico: la build ESM publicada
// de libsodium-wrappers 0.7.16 importa un './libsodium.mjs' que no viene en el
// tarball, y con serverExternalPackages + Turbopack el import dinámico la
// resolvía → lanzaba → TODO webhook moría en 401 'error-crypto' aunque la
// clave y el formato de la firma fueran correctos. node:crypto (Ed25519
// soportado nativamente desde Node 12) elimina la dependencia y su clase
// entera de fallos de carga.
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
 * Decodifica TELNYX_PUBLIC_KEY tolerando los formatos del portal (base64
 * —el típico— y hex de 32 bytes) y los residuos de copiar/pegar: el prefijo
 * `TELNYX_PUBLIC_KEY=` del .env, comillas envolventes y espacios/saltos de
 * línea invisibles que suelen colarse al pegar desde el portal.
 *
 * AUDITORÍA: el código original hacía `Buffer.from(publicKey, 'hex')` sobre
 * una clave base64 → devolvía 0 bytes → la verificación lanzaba, el catch
 * devolvía false y TODOS los webhooks de voz terminaban en 401 "Firma de
 * voz inválida": LlamadaLog quedaba siempre vacío y la telemetría de
 * llamadas se perdía.
 */
function decodeTelnyxPublicKey(raw: string): Buffer {
  const clean = raw
    .trim()
    .replace(/^TELNYX_PUBLIC_KEY=/, '')
    // Comillas simples o dobles envolventes (pegado desde .env o terminal).
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
  const asBase64 = Buffer.from(clean, 'base64');
  if (asBase64.length === 32) return asBase64;
  return Buffer.from(clean, 'hex');
}

/**
 * Decodifica la firma Ed25519 del header `telnyx-signature-ed25519`.
 *
 * AUDITORÍA: el código decodificaba SIEMPRE como hex
 * (`Buffer.from(signature, 'hex')`), pero el SDK oficial de voz decodifica la
 * firma como BASE64 (telnyx-node, src/lib/webhooks.ts:
 * `decodeBase64(signatureHeader)`). Con una firma base64 real, el parseo hex
 * para en el primer carácter no-hex y produce un buffer corto basura;
 * `crypto_sign_verify_detached` entonces devuelve false SIEMPRE, sin importar
 * la clave pública: todo webhook moría en 401 "Firma de voz inválida" aunque
 * la clave del portal y la de Render coincidieran. Los tests no lo veían
 * porque firmaban en hex — se auto-confirmaban el contrato equivocado.
 *
 * Se aceptan los DOS formatos (base64 = el real; hex = compatibilidad) y se
 * prueba la verificación con cada candidato de 64 bytes. Los alfabetos se
 * solapan (0-9a-f es base64 válido), así que la DISTINGUI es la longitud:
 * 88 chars base64 → 64 bytes; 128 chars hex → 64 bytes; un formato nunca
 * decodifica al otro con longitud 64, así que no hay ambigüedad.
 */
function decodeEd25519Signature(signature: string): Buffer[] {
  const candidatos: Buffer[] = [];
  const comoBase64 = Buffer.from(signature, 'base64');
  if (comoBase64.length === 64) candidatos.push(comoBase64);
  const comoHex = Buffer.from(signature, 'hex');
  if (comoHex.length === 64 && comoHex !== candidatos[0]) candidatos.push(comoHex);
  return candidatos;
}

/** Resultado de la verificación: en producción, `motivo` explica el 401. */
type VerificacionFirma = { ok: true } | { ok: false; motivo: string };

/**
 * Prefijo DER SPKI de una clave pública Ed25519 (OID 1.3.101.112 + bit string
 * de 32 bytes). Permite envolver los 32 bytes crudos del portal en un
 * KeyObject que node:crypto acepta para verificar.
 */
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

async function verifyTelnyx(req: NextRequest, raw: string): Promise<VerificacionFirma> {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  if (!publicKey || !signature || !timestamp) {
    // Sin headers no hay nada que verificar: en dev se deja pasar; en prod el
    // motivo dice QUÉ falta — ¿la app manda la firma v1 (API version vieja)?
    if (process.env.NODE_ENV !== 'production') return { ok: true };
    const motivo = !publicKey
      ? 'clave-publica-env-ausente'
      : !signature
        ? req.headers.get('telnyx-signature')
          ? 'sin-header-ed25519 (la app manda firma v1: pon Webhook API version = v2)'
          : 'sin-header-ed25519 (sin firma Ed25519 en la petición)'
        : 'sin-header-timestamp';
    return { ok: false, motivo };
  }
  const key = decodeTelnyxPublicKey(publicKey);
  if (key.length !== 32) {
    console.error('[telnyx] TELNYX_PUBLIC_KEY inválida: se esperaba base64 o hex de 32 bytes.');
    return { ok: false, motivo: `clave-decodifica-${key.length}bytes (no es clave de 32)` };
  }
  const firmas = decodeEd25519Signature(signature);
  if (firmas.length === 0) {
    const bytes = Buffer.from(signature, 'base64').length;
    console.error('[telnyx] firma Ed25519 inválida: se esperaba base64 o hex de 64 bytes.');
    return { ok: false, motivo: `firma-decodifica-${bytes}bytes (no es firma de 64)` };
  }
  try {
    // node:crypto nativo (Ed25519): sin libsodium, sin WASM, sin import
    // dinámico — ver comentario del encabezado del archivo.
    const msg = Buffer.from(`${timestamp}|${raw}`);
    const claveObj = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, key]),
      format: 'der',
      type: 'spki',
    });
    for (const sig of firmas) {
      // `null` como algoritmo: en Ed25519 el algoritmo es implícito en la
      // clave. Longitudes ya validadas (32 y 64), así que devuelve bool.
      if (verificarEd25519(null, msg, claveObj, sig)) return { ok: true };
    }
    // La firma ES del formato correcto pero no calza con la clave configurada:
    // la causa más común es TELNYX_PUBLIC_KEY desalineada con la del portal.
    return { ok: false, motivo: 'firma-no-verifica (clave pública desalineada con la del portal)' };
  } catch (err) {
    // El mensaje viaja al diagnóstico (logWebhookEvent) para que un 401 raro
    // diga QUÉ falló (p. ej. "error:10000076:elliptic curve routines...") sin
    // tener que leer los logs de Render. Node crypto no incluye material de
    // la clave en sus mensajes.
    console.error('[telnyx] verify error', err);
    const detalle = err instanceof Error ? err.message.slice(0, 140) : 'sin detalle';
    return { ok: false, motivo: `error-crypto: ${detalle}` };
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const verificacion = await verifyTelnyx(req, raw);
  if (!verificacion.ok) {
    // Rastro para /api/demo/diagnostic: el motivo dice POR QUÉ falló (¿app en
    // API version V1, clave ausente, clave que no mide 32 bytes, o firma que
    // no calza con la clave = desalineada portal/Render).
    logWebhookEvent({ type: 'unknown', fromMasked: null, outcome: `401: ${verificacion.motivo}`, sid: null });
    return NextResponse.json({ error: 'Firma de voz inválida' }, { status: 401 });
  }
  let event: TelnyxEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    logWebhookEvent({ type: 'unknown', fromMasked: null, outcome: 'json-invalido-400', sid: null });
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const type = event.data?.event_type ?? 'unknown';
  const p = event.data?.payload ?? {};
  const fromRaw = p.from ?? '';
  const fromNorm = normalizePhone(fromRaw ?? '');
  const fromMasked = fromNorm ? maskPhone(fromNorm) : null;
  // Resultado del evento para el log del diagnóstico (/api/demo/diagnostic).
  // Se recalcula en cada rama del handler y se registra UNA sola vez al final.
  let outcome = 'procesado';
  let logSid: string | null = null;
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

    // ── Demo en vivo: emparejar la llamada con la sesión del visitante ──
    // El flujo REAL de esta cuenta no emite `call.initiated` al webhook: el
    // assistant se engancha a nivel de número y el primer evento que llega es
    // `assistant.initialization` (con `from`). Por eso la regla es general:
    // CUALQUIER evento que traiga `from` coincide con una sesión waiting =>
    // pasa a `live`; y siempre que un evento traiga el conversation_id (en
    // cualquiera de sus alias) se asocia y arranca el polling del transcript.
    const convId =
      (p as { conversation_id?: string }).conversation_id ??
      (p as { conversationId?: string }).conversationId ??
      (p as { telnyx_conversation_id?: string }).telnyx_conversation_id ??
      (p as { conversation?: { id?: string } }).conversation?.id ??
      null;
    const ccId = p.call_control_id ?? '';
    const esEventoSesion =
      type === 'call.initiated' ||
      type === 'call.conversation.created' ||
      type.startsWith('assistant.');

    if (esEventoSesion) {
      // El orden real de eventos es: assistant.initialization PRIMERO (pasa
      // la sesión a live SIN conversation_id) y call.conversation.created
      // DESPUÉS trayendo el id — por eso la búsqueda cubre los TRES estados
      // de la sesión de esta llamada, o conversation_id se perdería.
      const todas = listSessionIds()
        .map((sid) => ({ sid, s: getSession(sid) }))
        .filter((x) => x.s && x.s.status !== 'ended');
      // 1) Waiting con teléfono del llamante (primer evento de la llamada).
      const porTelefono = fromNorm
        ? todas.filter((x) => x.s && x.s.phone === fromNorm)
        : [];
      // 2) Ya asociada a esta conversación/llamada (eventos posteriores).
      const porIds = todas.filter(
        (x) =>
          x.s &&
          ((convId !== null && x.s.conversationId === convId) ||
            (ccId !== '' && x.s.conversationId === ccId))
      );
      const sesion =
        porTelefono.find((x) => x.s?.status === 'waiting') ??
        porIds[0] ??
        // 3) Live SIN conversationId todavía (vino assistant.initialization
        //    antes y ahora llega el evento que trae el id).
        porTelefono.find((x) => x.s?.status === 'live' && x.s.conversationId === null) ??
        null;
      const sid = sesion?.sid ?? null;
      // Estado previo a mutar: solo una sesión que esperaba pasa a live y
      // solo en su primer evento se engancha el assistant.
      const eraEspera = sesion?.s?.status === 'waiting';

      if (sid) {
        logSid = sid;
        if (eraEspera) setStatus(sid, 'live');
        if (convId) {
          // conversation_id real: se asocia y se enciende el polling del
          // transcript (lo que alimenta el panel en vivo).
          associateCall(sid, ccId, convId);
          startPolling(sid);
          outcome = `sesion-live-conversacion(${type})`;
        } else {
          outcome = `sesion-live(${type})`;
        }
      } else if (fromNorm) {
        // Llamada que no coincide con ninguna sesión: dato clave del
        // diagnóstico (¿crearon sesión? ¿el número coincide?).
        outcome = `sin-sesion-coincidente(${type})`;
      }

      // Enganchar el assistant SOLO en call.initiated sin nadie contestado:
      // assistant.initialization significa que ya está en la llamada y
      // volver a contestar fallaría (la llamada ya fue contestada).
      if (eraEspera && type === 'call.initiated') {
        try {
          const cfg = getTelnyxConfig();
          if (cfg.assistantId && ccId) {
            await startAssistantOnCall(ccId, cfg.assistantId);
            outcome = 'sesion-live-assistant-enganchado';
          } else {
            outcome = cfg.assistantId
              ? 'sesion-live-sin-call-control-id'
              : 'sesion-live-sin-assistant-id-env';
          }
        } catch (err) {
          console.warn('[demo] no se pudo iniciar assistant en la llamada', err);
          outcome = 'sesion-live-error-al-iniciar-assistant';
        }
      }
    }

    // Fin de la conversación / de la llamada: cerrar la sesión del demo.
    // Prioridad: conversationId/ccId EXACTO sobre el fallback por teléfono —
    // con dos demos del mismo número, el match por teléfono cerraría la
    // sesión más vieja en vez de la de esta llamada.
    const esCierre =
      type === 'call.conversation.ended' ||
      type === 'call.hangup' ||
      type === 'call.hangup.final' ||
      type === 'assistant.conversation.ended';
    if (esCierre && !tiendaId) {
      const vivas = listSessionIds()
        .map((sId) => ({ sId, s: getSession(sId) }))
        .filter((x) => x.s && x.s.status === 'live');
      const porId = vivas.find(
        (x) =>
          x.s &&
          ((ccId !== '' && x.s.conversationId === ccId) ||
            (convId !== null && x.s.conversationId === convId))
      );
      const cierre =
        porId ??
        (fromNorm !== null ? vivas.find((x) => x.s && x.s.phone === fromNorm) : undefined);
      if (cierre?.s) {
        endSession(cierre.sId);
        logSid = cierre.sId;
        outcome = 'sesion-finalizada';
        const dur = minutesOfCall(event);
        if (dur > 0) setDuration(cierre.sId, Math.round(dur * 60));
      }
    }
  } catch (err) {
    console.error('[telnyx] webhook persist failed', err);
    outcome = 'error-de-persistencia';
  }

  // Rastro único por evento para /api/demo/diagnostic: el diagnóstico así
  // distingue "el webhook nunca llegó" de "llegó pero falló algo interno".
  // payloadKeys = solo nombres de campos del payload (diagnostica el esquema
  // de eventos desconocidos como assistant.* sin exponer valores).
  logWebhookEvent({
    type,
    fromMasked,
    outcome,
    sid: logSid,
    payloadKeys: Object.keys(p).slice(0, 24).join(','),
  });

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
