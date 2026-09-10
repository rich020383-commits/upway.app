import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PrismaClient, Tienda } from '@prisma/client';

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type HealthSessionContext = {
  user: SessionUser;
  role: string;
  organizationId: string;
  clinicId: string;
};

// Objeto "vacío" explícito para contextos sin tenant real.
// Se usa para no inventar 'default-org' / 'clinic-admin' que daban acceso fantasma.
export const EMPTY_TENANT_SCOPE = {
  role: '',
  organizationId: '',
  clinicId: '',
} as const;

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
 *
 * H2: el `meta-reviewer` no existe en User; se bloquea aquí para que ningún
 * endpoint que filtre por userId le devuelva datos ajenos por accidente.
 */
export async function getOwnedTienda(
  req: NextRequest,
  prisma: PrismaClient,
  tiendaId?: string | null
): Promise<{ tienda: Tienda; error?: undefined } | { tienda?: undefined; error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) return { error: unauthorized() };
  if (user.id === 'meta-reviewer') {
    return {
      error: NextResponse.json({ error: 'Revisor externo sin acceso a tiendas' }, { status: 403 }),
    };
  }

  const tienda = await prisma.tienda.findFirst({
    where: tiendaId
      ? { id: tiendaId, userId: user.id }
      : { userId: user.id },
    orderBy: { id: 'asc' },
  });

  if (!tienda) return { error: notFound() };

  return { tienda };
}

/**
 * Resuelve de forma segura el contexto de salud (rol, organización y clínica)
 * directamente del token de sesión JWT firmado, evitando la inyección de roles por URL o body.
 *
 * C6/H2 deny-by-default:
 * - Sin rol válido -> 401.
 * - `meta-reviewer` (id fantasma, no existe en User) -> 403 salvo módulo público.
 * - Sin organizationId/clinicId reales -> esos campos quedan undefined y
 *   `enforceHealthAccess`/`requireTenantScope` decidirán si el módulo los exige.
 *   Ya NO se inventan 'default-org' / 'default-clinic' / 'clinic-admin'.
 */
export async function getHealthSession(
  req: NextRequest
): Promise<
  | { context: HealthSessionContext; error?: undefined }
  | { context?: undefined; error: NextResponse }
> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return { error: unauthorized() };
  }

  if (token.id === 'meta-reviewer') {
    return {
      error: NextResponse.json(
        { error: 'Revisor externo sin acceso a datos de tenant' },
        { status: 403 }
      ),
    };
  }

  const role = typeof token.role === 'string' ? token.role : '';
  if (!role) {
    return { error: unauthorized() };
  }
  const organizationId = typeof token.organizationId === 'string' ? token.organizationId : '';
  const clinicId = typeof token.clinicId === 'string' ? token.clinicId : '';

  return {
    context: {
      user: {
        id: token.id as string,
        email: (token.email as string) ?? null,
        name: (token.name as string) ?? null,
      },
      role,
      organizationId,
      clinicId,
    },
  };
}
