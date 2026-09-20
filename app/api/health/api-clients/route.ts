import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { generateApiKey } from '@/lib/health/identity/apiKeys';

export const runtime = 'nodejs';
export const maxDuration = 30;

// El cliente Prisma generado en algunos entornos no expone el delegado en su
// tipo, aunque el modelo exista en el esquema aplicado.
type ApiClientDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown>;
  findFirst: (args: Record<string, unknown>) => Promise<any>;
  create: (args: Record<string, unknown>) => Promise<any>;
  update: (args: Record<string, unknown>) => Promise<any>;
};

const apiClient = (prisma as unknown as { apiClient: ApiClientDelegate }).apiClient;

/**
 * Gestion de llaves de API del cliente (integracion maquina-a-maquina).
 *
 * GET    /api/health/api-clients          → lista llaves (sin exponer secretos)
 * POST   /api/health/api-clients          → crea una llave. Devuelve el texto en
 *                                           claro UNA sola vez: no se puede recuperar.
 * DELETE /api/health/api-clients?id=...   → revoca la llave (no se borra).
 *
 * Alcance: solo la organizacion de la sesion. La llave hereda ese alcance y por
 * eso el endpoint de lectura /api/v1/identity nunca puede cruzar de tenant.
 */
export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  const clients = await apiClient.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    withTenantScope({ ok: true, clients }, { organizationId, clinicId, role })
  );
}

export async function POST(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId, user } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2) {
    return NextResponse.json(
      { error: 'Ponle un nombre reconocible a la llave (ej. "HIS Saludtools produccion").' },
      { status: 400 }
    );
  }

  const { key, keyHash, keyPrefix, lastFour } = generateApiKey();

  const created = await apiClient.create({
    data: {
      organizationId,
      clinicId: clinicId ?? null,
      name,
      keyHash,
      keyPrefix,
      createdByUserId: user.id,
    },
    select: { id: true, name: true, keyPrefix: true, createdAt: true },
  });

  // La llave en claro se devuelve UNA vez y no se persiste en ningun lado.
  return NextResponse.json(
    withTenantScope(
      {
        ok: true,
        client: created,
        key,
        lastFour,
        warning:
          'Guarda esta llave ahora: no se puede recuperar. Si se pierde, revoca y emite otra.',
      },
      { organizationId, clinicId, role }
    )
  );
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  // Scoping por organizacion: no se puede revocar la llave de otro tenant.
  const existing = await apiClient.findFirst({
    where: { id, organizationId },
    select: { id: true, revokedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Llave no encontrada' }, { status: 404 });
  }
  if (existing.revokedAt) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  const revoked = await apiClient.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), isActive: false },
    select: { id: true, revokedAt: true, isActive: true },
  });

  return NextResponse.json(
    withTenantScope({ ok: true, client: revoked }, { organizationId, clinicId, role })
  );
}
