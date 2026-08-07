import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    const tienda = await prisma.tienda.findFirst({
      where: { userId: session.user.id },
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
