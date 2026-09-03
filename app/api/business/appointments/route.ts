import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAppointmentFromLead } from '@/lib/business-ops';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    const appointments = await prisma.cita.findMany({
      where: tiendaId ? { tiendaId } : undefined,
      orderBy: { fechaHora: 'asc' },
      take: 50,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las citas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tiendaId,
      leadId,
      conversationId,
      clienteNombre,
      clienteTelefono,
      fechaHora,
      assignedToUserId,
      createdByUserId,
      location,
      notes,
      source,
    } = body ?? {};

    if (!tiendaId || !clienteNombre || !clienteTelefono || !fechaHora) {
      return NextResponse.json({ error: 'tiendaId, clienteNombre, clienteTelefono y fechaHora son requeridos' }, { status: 400 });
    }

    const result = await createAppointmentFromLead({
      tiendaId,
      leadId,
      conversationId,
      clienteNombre,
      clienteTelefono,
      fechaHora: new Date(fechaHora),
      assignedToUserId,
      createdByUserId,
      location,
      notes,
      source,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la cita' }, { status: 500 });
  }
}
