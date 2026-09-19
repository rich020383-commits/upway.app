import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { recordProviderEvent } from '@/lib/event-audit';
import { verifySharedSecret } from '@/lib/webhook-verify';

/**
 * Bitacora de eventos de proveedores externos.
 *
 * FIX AUDITORIA C3 (`webhooks/events`):
 * - GET: exponia los ultimos 25 eventos de integracion SIN autenticacion, con
 *   tenantId / clinicId / entityId de todas las clinicas. Ahora exige sesion y
 *   scope de clinica (deny-by-default: sin clinicId en el token -> 403).
 * - POST: permitia registrar eventos externos arbitrarios sin validar el
 *   origen, lo que permitia envenenar la bitacora que se usa como evidencia de
 *   auditoria. Ahora exige el secreto compartido `WEBHOOK_EVENTS_SECRET`.
 *
 * Nota de diseno: aqui NO aplica la laxitud de `/api/health/audit`, que cuando
 * la sesion no trae clinicId devuelve datos de todos los tenants. Un endpoint
 * de auditoria es justamente el que no puede tener ese fallback.
 */

const WEBHOOK_EVENTS_SECRET = process.env.WEBHOOK_EVENTS_SECRET ?? '';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { clinicId } = context;

  // Deny-by-default: sin clinica en el token no hay scope valido que mostrar.
  if (!clinicId) {
    return NextResponse.json(
      { success: false, error: 'Sesion sin clinica asociada' },
      { status: 403 }
    );
  }

  const events = await prisma.webhookEventLog.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  return NextResponse.json({
    success: true,
    events: events.map((event) => ({
      id: event.id,
      provider: event.provider,
      eventType: event.eventType,
      status: event.status,
      clinicId: event.clinicId,
      entityType: event.entityType,
      entityId: event.entityId,
      createdAt: event.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  // Fail-closed: sin secreto configurado, en produccion se rechaza siempre.
  if (!WEBHOOK_EVENTS_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[webhooks:events] WEBHOOK_EVENTS_SECRET no configurado. Evento rechazado en produccion.'
      );
      return NextResponse.json(
        { success: false, error: 'Endpoint no configurado' },
        { status: 503 }
      );
    }
    console.warn(
      '[webhooks:events] WEBHOOK_EVENTS_SECRET no configurado (solo se advierte en desarrollo).'
    );
  } else if (
    !verifySharedSecret(req.headers.get('x-webhook-secret'), WEBHOOK_EVENTS_SECRET)
  ) {
    return NextResponse.json(
      { success: false, error: 'Firma de webhook invalida' },
      { status: 401 }
    );
  }

  try {
    const payload = await req.json();
    const provider = String(payload?.provider ?? '');
    const eventType = String(payload?.eventType ?? 'generic_event');
    const status = String(payload?.status ?? 'received');

    // Validar status contra el union type para evitar casts implícitos
    const validStatuses = ['received', 'accepted', 'processed', 'rejected', 'failed'] as const;
    const parsedStatus = (validStatuses as readonly string[]).includes(status)
      ? (status as (typeof validStatuses)[number])
      : ('received' as const);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'provider is required' }, { status: 400 });
    }

    const event = await recordProviderEvent({
      provider,
      eventType,
      status: parsedStatus,
      clinicId: payload?.clinicId ?? null,
      tenantId: payload?.tenantId ?? null,
      entityType: payload?.entityType ?? null,
      entityId: payload?.entityId ?? null,
      performedBy: payload?.performedBy ?? null,
      payload: payload?.payload ?? payload,
      metadata: {
        source: payload?.source ?? 'external_api',
        correlationId: payload?.correlationId ?? null,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id, status: event.status });
  } catch (error) {
    console.error('❌ Error registrando evento externo:', error);
    return NextResponse.json({ success: false, error: 'Unable to process event' }, { status: 500 });
  }
}
