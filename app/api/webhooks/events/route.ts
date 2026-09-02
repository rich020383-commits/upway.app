import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordProviderEvent } from '@/lib/event-audit';

export async function GET() {
  const events = await prisma.webhookEventLog.findMany({
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
      tenantId: event.tenantId,
      clinicId: event.clinicId,
      entityType: event.entityType,
      entityId: event.entityId,
      createdAt: event.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const provider = String(payload?.provider ?? 'unknown');
    const eventType = String(payload?.eventType ?? 'generic_event');
    const status = String(payload?.status ?? 'received');

    if (!provider || provider === 'unknown') {
      return NextResponse.json({ success: false, error: 'provider is required' }, { status: 400 });
    }

    const event = await recordProviderEvent({
      provider,
      eventType,
      status: status as any,
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
