import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Falta el correo del usuario' }, { status: 400 });
    }

    // Buscamos a tu usuario real
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 🔥 CORRECCIÓN: Buscamos la tienda sin el "orderBy" que rompía TypeScript
    const tienda = await prisma.tienda.findFirst({
      where: { userId: user.id }
    });

    if (!tienda) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      tiendaId: tienda.id,
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