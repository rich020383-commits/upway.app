import type { VerticalType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Garantiza que un usuario tenga su propio tenant (Organization + Clinic) y
 * que su Tienda quede vinculada a él.
 *
 * Por qué existe: el registro por credenciales crea org + clinic + tienda en
 * una transacción, pero el alta por Google/LinkedIn solo creaba User + Tienda.
 * Como el callback JWT deriva `token.role = organization ? 'owner' : ''`, esa
 * cuenta quedaba con rol vacío y TODA la capa Health devolvía
 * `Access denied: missing role` (403) — entre otros síntomas, la tarjeta de
 * voz de /health/production no recibía `tiendaId` y se quedaba inerte.
 */
export type WorkspaceScope = {
  organizationId: string;
  clinicId: string;
};

const segmentToVertical: Record<string, VerticalType> = {
  health: 'HEALTH',
  salud: 'HEALTH',
  clinica: 'HEALTH',
  clinicas: 'HEALTH',
  inmobiliaria: 'BUSINESS',
  inmobiliarias: 'BUSINESS',
  retail: 'BUSINESS',
  tienda: 'BUSINESS',
  tiendas: 'BUSINESS',
  supermercado: 'BUSINESS',
  supermercados: 'BUSINESS',
  drogueria: 'BUSINESS',
  droguerias: 'BUSINESS',
  center: 'BUSINESS',
  general: 'BUSINESS',
};

function verticalForSegment(segment?: string | null): VerticalType {
  const normalized = (segment ?? '').trim().toLowerCase();
  return segmentToVertical[normalized] ?? 'BUSINESS';
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

export async function ensureOwnedWorkspace(
  userId: string,
  overrides?: { name?: string | null }
): Promise<WorkspaceScope | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return null;

  const tienda = await prisma.tienda.findFirst({
    where: { userId: user.id },
    select: { segment: true },
  });

  const vertical = verticalForSegment(tienda?.segment);
  const workspaceName =
    overrides?.name?.trim() || user.name?.trim() || user.email?.split('@')[0] || 'Mi espacio';

  const linkTienda = async (scope: WorkspaceScope) => {
    await prisma.tienda.updateMany({
      where: { userId: user.id, organizationId: null },
      data: { organizationId: scope.organizationId, clinicId: scope.clinicId },
    });
    await prisma.tienda.updateMany({
      where: { userId: user.id, clinicId: null },
      data: { clinicId: scope.clinicId },
    });
  };

  const owned = await prisma.organization.findFirst({
    where: { ownerId: user.id },
    include: { clinics: { orderBy: { createdAt: 'asc' }, take: 1 } },
  });

  if (!owned) {
    try {
      const organization = await prisma.organization.create({
        data: {
          name: workspaceName,
          slug: `workspace-${user.id}`,
          vertical,
          ownerId: user.id,
          verticals: [vertical],
        },
      });
      const clinic = await prisma.clinic.create({
        data: {
          organizationId: organization.id,
          name: vertical === 'HEALTH' ? 'Clínica principal' : 'Negocio principal',
          specialty: vertical === 'HEALTH' ? 'Atención médica general' : 'Operación comercial',
          timezone: 'UTC',
          vertical,
          status: 'active',
        },
      });
      const scope = { organizationId: organization.id, clinicId: clinic.id };
      await linkTienda(scope);
      return scope;
    } catch (error) {
      // Dos requests concurrentes pueden cruzarse: el slug único resuelve la
      // carrera y reintentamos leyendo la organización ya creada.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  const current =
    owned ??
    (await prisma.organization.findFirst({
      where: { ownerId: user.id },
      include: { clinics: { orderBy: { createdAt: 'asc' }, take: 1 } },
    }));
  if (!current) return null;

  const existingClinic = current.clinics[0];
  const clinic =
    existingClinic ??
    (await prisma.clinic.create({
      data: {
        organizationId: current.id,
        name: vertical === 'HEALTH' ? 'Clínica principal' : 'Negocio principal',
        specialty: vertical === 'HEALTH' ? 'Atención médica general' : 'Operación comercial',
        timezone: 'UTC',
        vertical,
        status: 'active',
      },
    }));

  const scope = { organizationId: current.id, clinicId: clinic.id };
  await linkTienda(scope);
  return scope;
}
