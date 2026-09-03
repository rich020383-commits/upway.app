import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runLeadAutomation } from '@/lib/business-ops';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    const pendingReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        ...(tiendaId ? { lead: { tiendaId } } : {}),
      },
    });

    const dueReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        ...(tiendaId ? { lead: { tiendaId } } : {}),
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tiendaId, limit } = body ?? {};

    const result = await runLeadAutomation({
      tiendaId: typeof tiendaId === 'string' ? tiendaId : null,
      limit: typeof limit === 'number' ? limit : 50,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error running lead automation:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo ejecutar la automatización' }, { status: 500 });
  }
}
