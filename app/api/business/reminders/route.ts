import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLeadReminder } from '@/lib/business-ops';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    const reminders = await prisma.leadReminder.findMany({
      where: leadId ? { leadId } : undefined,
      orderBy: { scheduledFor: 'asc' },
      take: 50,
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los recordatorios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, scheduledFor, message, channel, createdByUserId, appointmentId, conversationId } = body ?? {};

    if (!leadId || !scheduledFor) {
      return NextResponse.json({ error: 'leadId y scheduledFor son requeridos' }, { status: 400 });
    }

    const reminder = await createLeadReminder({
      leadId,
      scheduledFor: new Date(scheduledFor),
      message,
      channel,
      createdByUserId,
      appointmentId,
      conversationId,
    });

    return NextResponse.json({ ok: true, reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el recordatorio' }, { status: 500 });
  }
}
