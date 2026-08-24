import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Asegúrate de que esta sea la ruta correcta a tu instancia de Prisma

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tiendaId, isAiActive } = body;

    if (!tiendaId) {
      return NextResponse.json({ error: 'Falta el ID de la tienda' }, { status: 400 });
    }

    // Actualizamos el estado en la base de datos
    const tienda = await prisma.tienda.update({
      where: { id: tiendaId },
      data: { isAiActive: isAiActive },
    });

    return NextResponse.json({ 
      success: true, 
      mensaje: isAiActive ? '🤖 IA Reactivada' : '🛑 IA Pausada (Modo Humano)',
      isAiActive: tienda.isAiActive 
    });

  } catch (error) {
    console.error('Error al cambiar el estado de la IA:', error);
    return NextResponse.json({ error: 'Fallo al actualizar el estado' }, { status: 500 });
  }
}