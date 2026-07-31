import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { tienda_id, nombre, reglas } = await req.json();

    if (!tienda_id) {
      return NextResponse.json({ error: 'Falta el ID de la tienda' }, { status: 400 });
    }

    // Actualizamos la tienda del cliente con su nuevo bot
    const tiendaActualizada = await prisma.tienda.update({
      where: { id: tienda_id },
      data: {
        agentName: nombre,
        systemPrompt: reglas
      }
    });

    return NextResponse.json({ success: true, tienda: tiendaActualizada });
  } catch (error) {
    console.error('Error guardando el bot en base de datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}