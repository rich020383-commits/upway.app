import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    // 🚀 1. Extraemos el telefonoAdmin que nos enviará el frontend
    const { tienda_id, nombre, reglas, telefonoAdmin } = await req.json();

    if (!nombre || typeof nombre !== 'string' || nombre.length > 100) {
      return NextResponse.json({ error: 'Nombre de agente inválido' }, { status: 400 });
    }
    if (!reglas || typeof reglas !== 'string' || reglas.length > 8000) {
      return NextResponse.json({ error: 'Reglas inválidas' }, { status: 400 });
    }

    // 🛡️ Solo el dueño puede configurar su tienda (404 si no existe o no es suya)
    const { tienda: tiendaPropia, error } = await getOwnedTienda(req, prisma, tienda_id);
    if (error) return error;

    const tiendaActualizada = await prisma.tienda.update({
      where: { id: tiendaPropia.id },
      data: {
        agentName: nombre,
        systemPrompt: reglas,
        telefonoAdmin: telefonoAdmin ? String(telefonoAdmin) : null // 🚀 2. Lo guardamos en la base de datos
      }
    });
    return NextResponse.json({ success: true, tienda: tiendaActualizada });

  } catch (error) {
    console.error('Error guardando el bot en base de datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}