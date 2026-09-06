import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    const tienda = await prisma.tienda.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true },
    });

    if (!tienda) {
      return NextResponse.json({ error: 'No existe una tienda asociada a este usuario' }, { status: 404 });
    }

    return NextResponse.json({ tiendaId: tienda.id, tienda });
  } catch (error) {
    console.error('Error obteniendo la tienda actual:', error);
    return NextResponse.json({ error: 'No se pudo obtener la tienda actual' }, { status: 500 });
  }
}
