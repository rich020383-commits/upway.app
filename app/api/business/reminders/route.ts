import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { createLeadReminder } from '@/lib/business-ops';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          tienda: { userId: sessionUser.id },
        },
      });

      if (!lead) {
        return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
      }
    }

    const reminders = await prisma.leadReminder.findMany({
      where: leadId
        ? { leadId, lead: { tienda: { userId: sessionUser.id } } }
        : { lead: { tienda: { userId: sessionUser.id } } },
      orderBy: { scheduledFor: 'asc' },
      take: 50,
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los recordatorios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, scheduledFor, message, channel, createdByUserId, appointmentId, conversationId } = body ?? {};

    if (!leadId || !scheduledFor) {
      return NextResponse.json({ error: 'leadId y scheduledFor son requeridos' }, { status: 400 });
    }

    // 🛡️ Validar que el lead pertenezca a una tienda del usuario
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tienda: { userId: sessionUser.id },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado para este usuario' }, { status: 404 });
    }

    const reminder = await createLeadReminder({
      leadId,
      scheduledFor: new Date(scheduledFor),
      message,
      channel,
      createdByUserId: createdByUserId ?? sessionUser.id,
      appointmentId,
      conversationId,
    });

    return NextResponse.json({ ok: true, reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el recordatorio' },
      { status: 500 }
    );
  }
}
