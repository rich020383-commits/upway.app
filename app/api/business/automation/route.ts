import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { runLeadAutomation } from '@/lib/business-ops';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTiendaId = searchParams.get('tiendaId');

    const { tienda, error } = await getOwnedTienda(request, prisma, requestedTiendaId);
    if (error) return error;

    const pendingReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        lead: { tiendaId: tienda.id },
      },
    });

    const dueReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        lead: { tiendaId: tienda.id },
      },
    });

    return NextResponse.json({
      ok: true,
      pendingReminders,
      dueReminders,
    });
  } catch (error) {
    console.error('Error fetching automation status:', error);
    return NextResponse.json({ error: 'No se pudo obtener el estado de automatización' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tiendaId: requestedTiendaId, limit } = body ?? {};

    const { tienda, error } = await getOwnedTienda(request, prisma, requestedTiendaId);
    if (error) return error;

    const result = await runLeadAutomation({
      tiendaId: tienda.id,
      limit: typeof limit === 'number' ? limit : 50,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error running lead automation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo ejecutar la automatización' },
      { status: 500 }
    );
  }
}
