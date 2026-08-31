import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tiendaId, isAiActive } = body;

    // 🛡️ Solo el dueño puede cambiar el modo IA de su tienda
    const { tienda: tiendaPropia, error } = await getOwnedTienda(req, prisma, tiendaId);
    if (error) return error;

    if (typeof isAiActive !== 'boolean') {
      return NextResponse.json({ error: 'isAiActive debe ser booleano' }, { status: 400 });
    }

    // Actualizamos el estado en la base de datos
    const tienda = await prisma.tienda.update({
      where: { id: tiendaPropia.id },
      data: { isAiActive },
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