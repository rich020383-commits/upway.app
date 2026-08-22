import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 });
    }

    // 🔥 Buscamos la tienda real vinculada a este usuario
    const tienda = await prisma.tienda.findFirst({
      where: { userId: userId },
    });

    if (!tienda) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      tiendaId: tienda.id, // Devolvemos el ID real de la base de datos
      isWhatsAppActive: tienda.isWhatsAppActive,
      metaPhoneNumberId: tienda.metaPhoneNumberId,
      telefono: tienda.metaPhoneNumberId, 
      leads: 0, 
      citas: 0,
      horasAhorradas: 0,
      resolucion: 0
    });
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}