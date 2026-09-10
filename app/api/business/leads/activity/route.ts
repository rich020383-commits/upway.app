import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'leadId es requerido' }, { status: 400 });
    }

    // 🛡️ Validar que el lead pertenezca a una tienda del usuario autenticado
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tienda: { userId: sessionUser.id },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado para este usuario' }, { status: 404 });
    }

    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    console.error('Error fetching lead activity:', error);
    return NextResponse.json({ error: 'No se pudo cargar el timeline del lead' }, { status: 500 });
  }
}
