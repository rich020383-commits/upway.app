import { prisma } from '@/lib/prisma';

const DEFAULT_ORGANIZATION_SLUG = 'demo-health-organization';
const DEFAULT_CLINIC_NAME = 'Clínica demo Upway Health';
const DEFAULT_USER_EMAIL = 'demo-health@upway.local';

/**
 * El tenant demo necesita su Tienda: es el contenedor de la voz (número,
 * assistant, flags Telnyx) y el checklist de activación exige `hasTienda`.
 * Sin ella, el check `Voz Telnyx dedicada` nunca se puede poner en verde para
 * este tenant y cualquier consulta resuelta por organizationId/clinicId no
 * encuentra nada.
 *
 * Idempotente: enlaza una Tienda huérfana del mismo dueño si existe y solo
 * crea cuando realmente no hay ninguna.
 */
async function ensureDemoTienda(
  organization: { id: string; ownerId: string },
  clinic: { id: string; name: string }
) {
  const linked = await prisma.tienda.findFirst({
    where: { userId: organization.ownerId, organizationId: organization.id },
  });
  if (linked) {
    if (linked.clinicId === clinic.id) return linked;
    return prisma.tienda.update({
      where: { id: linked.id },
      data: { clinicId: clinic.id },
    });
  }

  const owned = await prisma.tienda.findFirst({ where: { userId: organization.ownerId } });
  if (owned) {
    return prisma.tienda.update({
      where: { id: owned.id },
      data: { organizationId: organization.id, clinicId: clinic.id },
    });
  }

  return prisma.tienda.create({
    data: {
      userId: organization.ownerId,
      organizationId: organization.id,
      clinicId: clinic.id,
      nombre: clinic.name,
      segment: 'health',
      // Workspace de demostración: no debe encender un bot que no está
      // aprovisionado. El resto de tiendas conservan el default true.
      isAiActive: false,
    },
  });
}

async function findClinicOf(organizationId: string) {
  const named = await prisma.clinic.findFirst({
    where: { organizationId, name: DEFAULT_CLINIC_NAME },
  });
  if (named) return named;
  // Si el nombre de la demo cambió, reutilizamos cualquier clínica de ese
  // mismo workspace en vez de crear una duplicada en cada llamada.
  return prisma.clinic.findFirst({ where: { organizationId } });
}

/**
 * Resuelve (o crea) el contexto demo de Organization/Clinic usado como
 * fallback cuando aún no hay un tenant real asociado a la sesión. Mismo
 * patrón que ya usa /api/health/onboarding, centralizado aquí para que
 * triage/faq/policies/compliance no dupliquen la lógica.
 */
async function ensureDefaultContext(organizationId?: string) {
  const existingOrganization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findUnique({ where: { slug: DEFAULT_ORGANIZATION_SLUG } });

  if (existingOrganization) {
    const existingClinic = await findClinicOf(existingOrganization.id);
    if (existingClinic) {
      // Solo el workspace demo lleva Tienda propia: para una organización
      // real el alta la hace el flujo de registro / auth.
      if (existingOrganization.slug === DEFAULT_ORGANIZATION_SLUG) {
        await ensureDemoTienda(existingOrganization, existingClinic);
      }
      return { organization: existingOrganization, clinic: existingClinic };
    }
  }

  const demoUser = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, name: 'Demo Health Admin' },
  });

  const organization =
    existingOrganization ??
    (await prisma.organization.create({
      data: {
        name: 'Demo Health Organization',
        slug: organizationId ? `org-${organizationId}` : DEFAULT_ORGANIZATION_SLUG,
        ownerId: demoUser.id,
        verticals: ['HEALTH'],
      },
    }));

  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: DEFAULT_CLINIC_NAME,
      specialty: 'Atención médica general',
      status: 'active',
      timezone: 'UTC',
    },
  });

  if (organization.slug === DEFAULT_ORGANIZATION_SLUG) {
    await ensureDemoTienda(organization, clinic);
  }

  return { organization, clinic };
}

export async function ensureClinicForId(clinicId?: string | null, organizationId?: string) {
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (clinic) return clinic;
  }

  const { clinic } = await ensureDefaultContext(organizationId);
  return clinic;
}

/**
 * Garantiza que la clínica resuelta tenga un HealthProfile (contenedor de
 * triage rules, FAQs, políticas). Lo crea con valores por defecto si falta.
 */
export async function ensureHealthProfile(clinicId: string) {
  const existing = await prisma.healthProfile.findUnique({ where: { clinicId } });
  if (existing) return existing;

  return prisma.healthProfile.create({
    data: { clinicId },
  });
}
