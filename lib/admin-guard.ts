import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return ADMIN_EMAILS.includes(normalized);
}

/**
 * Guard para rutas de administración y de diagnóstico.
 *
 * Devuelve null si la petición viene de un administrador y, en caso contrario,
 * la respuesta de error lista para retornar:
 *
 *   const denied = await requireAdmin(request);
 *   if (denied) return denied;
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: 'No hay sesión activa.' }, { status: 401 });
  }

  if (!isAdminEmail(sessionUser.email)) {
    return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
  }

  return null;
}
