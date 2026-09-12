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
    enforceHealthAccess({ role, module: 'inbox', organizationId, clinicId });

    // Tienda real del usuario (vínculo org/clinic creado en register).
    const tienda =
      (await prisma.tienda.findFirst({ where: { userId: context.user.id } })) ??
      (await prisma.tienda.findFirst({
        where: {
          ...(organizationId ? { organizationId } : {}),
          ...(clinicId ? { clinicId } : {}),
        },
      }));

    if (!tienda) {
      return NextResponse.json(withTenantScope({ items: [] }, { organizationId, clinicId, role }));
    }

    const conversations = await prisma.conversation.findMany({
      where: { tiendaId: tienda.id },
      include: {
        lead: { select: { id: true, nombre: true, estado: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    });

    const items = conversations.map((c) => ({
      id: c.id,
      patient: c.clientName || c.lead?.nombre || c.clientPhone,
      channel: 'WhatsApp',
      priority: c.lead?.estado ?? 'NEW',
      summary: (c.messages?.[0]?.content ?? 'Sin mensajes').slice(0, 120),
      status: c.status,
      clientPhone: c.clientPhone,
      updatedAt: c.updatedAt,
    }));

    const payload = withTenantScope({ items }, { organizationId, clinicId, role });

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}
