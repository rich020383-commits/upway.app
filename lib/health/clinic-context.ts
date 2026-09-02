import { prisma } from '@/lib/prisma';

const DEFAULT_ORGANIZATION_SLUG = 'demo-health-organization';
const DEFAULT_CLINIC_NAME = 'Clínica demo Upway Health';
const DEFAULT_USER_EMAIL = 'demo-health@upway.local';

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
    const clinic = await prisma.clinic.findFirst({
      where: { organizationId: existingOrganization.id, name: DEFAULT_CLINIC_NAME },
    });
    if (clinic) return { organization: existingOrganization, clinic };
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
