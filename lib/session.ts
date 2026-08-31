import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PrismaClient, Tienda } from '@prisma/client';

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

const unauthorized = () =>
  NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });

const notFound = () =>
  NextResponse.json(
    { error: 'Tienda no encontrada para este usuario' },
    { status: 404 }
  );

/**
 * Extrae y valida el usuario de la sesión NextAuth (JWT firmado con NEXTAUTH_SECRET).
 * Devuelve null si no hay sesión válida — usar en TODOS los endpoints que mutan o leen datos privados.
 */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) return null;
  return {
    id: token.id as string,
    email: (token.email as string) ?? null,
    name: (token.name as string) ?? null,
  };
}

/**
 * Garantiza que el usuario autenticado es dueño de la tienda indicada.
 * Si no envía tiendaId, resuelve automáticamente SU primera tienda.
 * Devuelve { tienda } o { error: NextResponse } — nunca expone tiendas ajenas (404, no 403).
 */
export async function getOwnedTienda(
  req: NextRequest,
  prisma: PrismaClient,
  tiendaId?: string | null
): Promise<{ tienda: Tienda; error?: undefined } | { tienda?: undefined; error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) return { error: unauthorized() };

  const tienda = await prisma.tienda.findFirst({
    where: tiendaId
      ? { id: tiendaId, userId: user.id }
      : { userId: user.id },
    orderBy: { id: 'asc' },
  });

  if (!tienda) return { error: notFound() };

  return { tienda };
}
