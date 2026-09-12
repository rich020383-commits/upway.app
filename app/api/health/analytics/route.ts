import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'analytics', organizationId, clinicId });

    // Tienda real del usuario para métricas operativas (leads, citas, voz).
    const tienda =
      (await prisma.tienda.findFirst({ where: { userId: context.user.id } })) ??
      (await prisma.tienda.findFirst({
        where: {
          ...(organizationId ? { organizationId } : {}),
          ...(clinicId ? { clinicId } : {}),
        },
      }));

    if (!tienda) {
      return NextResponse.json(
        withTenantScope(
          { summary: { conversations: 0, resolved: 0, escalations: 0, noShows: 0, avgResponseSeconds: 0 } },
          { organizationId, clinicId, role }
        )
      );
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [leads, appointments, messages, voiceAgg] = await Promise.all([
      prisma.lead.count({ where: { tiendaId: tienda.id } }),
      prisma.cita.count({ where: { tiendaId: tienda.id, fechaHora: { gte: new Date() } } }),
      prisma.message.count({ where: { conversation: { tiendaId: tienda.id }, createdAt: { gte: monthStart } } }),
      prisma.llamadaLog.aggregate({
        where: { tiendaId: tienda.id, createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { durationMinutes: true, telnyxCost: true, vapiCost: true, upwayBilledCost: true },
      }),
    ]);

    const telnyxCost = (voiceAgg._sum.telnyxCost ?? 0) + (voiceAgg._sum.vapiCost ?? 0);
    const payload = withTenantScope(
      {
        summary: {
          conversations: messages,
          resolved: leads,
          escalations: appointments,
          noShows: 0,
          avgResponseSeconds: 0,
          voiceCalls: voiceAgg._count._all,
          voiceMinutes: Math.round((voiceAgg._sum.durationMinutes ?? 0) * 10) / 10,
          telnyxCost: Math.round(telnyxCost * 100) / 100,
          billedCost: Math.round((voiceAgg._sum.upwayBilledCost ?? 0) * 100) / 100,
        },
      },
      { organizationId, clinicId, role }
    );

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Acceso denegado' },
      { status: 403 }
    );
  }
}
