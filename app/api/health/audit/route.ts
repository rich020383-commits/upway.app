import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { clinicId } = context;
  const isClinicScoped = Boolean(clinicId && clinicId !== 'default-clinic');

  const [healthAuditEntries, providerEvents] = await Promise.all([
    prisma.healthAuditLog.findMany({
      where: isClinicScoped ? { clinicId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.webhookEventLog.findMany({
      where: isClinicScoped ? { clinicId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  const items = [
    ...healthAuditEntries.map((entry) => ({
      id: entry.id,
      type: 'health_audit',
      provider: 'internal',
      actor: entry.performedBy ?? 'Sistema',
      action: entry.action,
      entity: `${entry.entityType} / ${entry.entityId}`,
      status: 'Recorded',
      createdAt: entry.createdAt,
      clinicName: entry.clinic?.name ?? 'Sin clínica',
    })),
    ...providerEvents.map((event) => ({
      id: event.id,
      type: 'webhook_event',
      provider: event.provider,
      actor: event.performedBy ?? 'Provider',
      action: event.eventType,
      entity: event.entityType ?? 'event',
      status: event.status,
      createdAt: event.createdAt,
      clinicName: event.clinicId ?? 'Sin clínica',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ success: true, items: items.slice(0, 25) });
}
