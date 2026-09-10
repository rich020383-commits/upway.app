import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { createAppointmentFromLead } from '@/lib/business-ops';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTiendaId = searchParams.get('tiendaId');

    // 🛡️ Exigir sesión y validar pertenencia de la tienda
    const { tienda, error } = await getOwnedTienda(request, prisma, requestedTiendaId);
    if (error) return error;

    const appointments = await prisma.cita.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { fechaHora: 'asc' },
      take: 50,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las citas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tiendaId: requestedTiendaId,
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

    if (!clienteNombre || !clienteTelefono || !fechaHora) {
      return NextResponse.json(
        { error: 'clienteNombre, clienteTelefono y fechaHora son requeridos' },
        { status: 400 }
      );
    }

    // 🛡️ Exigir sesión y validar propiedad de la tienda destino
    const { tienda, error } = await getOwnedTienda(request, prisma, requestedTiendaId);
    if (error) return error;

    const result = await createAppointmentFromLead({
      tiendaId: tienda.id,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear la cita' },
      { status: 500 }
    );
  }
}
