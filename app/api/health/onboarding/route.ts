import { prisma } from '@/lib/prisma';
import { getHealthStatusForStage, onboardingStages } from '@/lib/health/onboarding';

const DEFAULT_CLINIC_ID = 'demo-clinic';
const DEFAULT_ORGANIZATION_SLUG = 'demo-health-organization';
const DEFAULT_CLINIC_NAME = 'Clínica demo Upway Health';
const DEFAULT_USER_EMAIL = 'demo-health@upway.local';

function parseJsonNotes(input: unknown) {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  if (typeof input === 'object') return input as Record<string, unknown>;
  return {};
}

async function ensureDefaultContext(organizationId?: string) {
  const fallbackOrgId = organizationId ?? 'default-org';

  const existingOrganization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findUnique({ where: { slug: DEFAULT_ORGANIZATION_SLUG } });

  if (existingOrganization) {
    const clinic = await prisma.clinic.findFirst({
      where: { organizationId: existingOrganization.id, name: DEFAULT_CLINIC_NAME },
    });

    return { organization: existingOrganization, clinic };
  }

  const demoUser = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: 'Demo Health Admin',
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Health Organization',
      slug: fallbackOrgId === 'default-org' ? DEFAULT_ORGANIZATION_SLUG : `org-${fallbackOrgId}`,
      ownerId: demoUser.id,
      verticals: ['HEALTH'],
    },
  });

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

async function ensureClinicForId(clinicId: string, organizationId?: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (clinic) return clinic;

  const { clinic: fallbackClinic } = await ensureDefaultContext(organizationId);
  if (!fallbackClinic) {
    throw new Error('Unable to create a default clinic context for health onboarding.');
  }

  return fallbackClinic;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId') ?? DEFAULT_CLINIC_ID;
  const organizationId = searchParams.get('organizationId') ?? undefined;

  try {
    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) {
      throw new Error('Health onboarding clinic context could not be resolved.');
    }

    const session = await prisma.healthOnboardingSession.findFirst({
      where: { clinicId: clinic.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (session) {
      const formData = parseJsonNotes(session.notes);
      return Response.json({
        clinicId: session.clinicId,
        currentStep: session.currentStep,
        status: session.status,
        progressPercent: session.progressPercent,
        notes: session.notes ?? '',
        formData,
      });
    }

    return Response.json({
      clinicId: clinic.id,
      currentStep: onboardingStages[0],
      status: 'DRAFT',
      progressPercent: 0,
      notes: 'Se ha creado esta sesión inicial para la clínica.',
      formData: {},
    });
  } catch (error) {
    console.warn('Health onboarding fallback activated:', error);
    return Response.json({
      clinicId,
      currentStep: onboardingStages[0],
      status: 'DRAFT',
      progressPercent: 0,
      notes: 'La sesión de onboarding se mantiene en modo demo mientras la base de datos no tiene registros.',
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clinicId = String(body.clinicId ?? DEFAULT_CLINIC_ID);
    const organizationId = body.organizationId ? String(body.organizationId) : undefined;
    const currentStep = String(body.currentStep ?? onboardingStages[0]);
    const notes = String(body.notes ?? '');
    const formData = parseJsonNotes(body.formData ?? body.notes ?? {});
    const normalizedStep = onboardingStages.includes(currentStep as (typeof onboardingStages)[number])
      ? currentStep
      : onboardingStages[0];

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) {
      throw new Error('Health onboarding clinic context could not be resolved.');
    }

    const progressPercent = Math.round(
      ((onboardingStages.indexOf(normalizedStep as (typeof onboardingStages)[number]) + 1) /
        onboardingStages.length) *
        100
    );

    const status = String(body.status ?? getHealthStatusForStage(normalizedStep));

    const existing = await prisma.healthOnboardingSession.findFirst({
      where: { clinicId: clinic.id },
      orderBy: { updatedAt: 'desc' },
    });

    const profilePayload: Record<string, string | boolean> = {};
    if (typeof formData.specialty === 'string' && formData.specialty.trim()) {
      profilePayload.specialty = formData.specialty.trim();
    }
    if (typeof formData.careModel === 'string' && formData.careModel.trim()) {
      profilePayload.appointmentMode = formData.careModel.trim();
    }
    if (typeof formData.cancellationWindow === 'string' && formData.cancellationWindow.trim()) {
      profilePayload.cancellationPolicy = formData.cancellationWindow.trim();
    }
    if (typeof formData.tone === 'string' && formData.tone.trim()) {
      profilePayload.toneProfile = formData.tone.trim();
    }

    if (Object.keys(profilePayload).length > 0) {
      await prisma.healthProfile.upsert({
        where: { clinicId: clinic.id },
        update: profilePayload,
        create: {
          clinicId: clinic.id,
          ...profilePayload,
        },
      });
    }

    const payload = {
      clinicId: clinic.id,
      currentStep: normalizedStep,
      status: status as
        | 'DRAFT'
        | 'IN_PROGRESS'
        | 'PENDING_REVIEW'
        | 'NEEDS_CHANGES'
        | 'APPROVED'
        | 'TESTING'
        | 'ACTIVE'
        | 'PAUSED'
        | 'BLOCKED'
        | 'ARCHIVED',
      progressPercent,
      notes: notes || JSON.stringify(formData),
    };

    const updated = existing
      ? await prisma.healthOnboardingSession.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.healthOnboardingSession.create({ data: payload });

    if (['PENDING_REVIEW', 'NEEDS_CHANGES', 'APPROVED'].includes(updated.status)) {
      const existingApproval = await prisma.healthOnboardingApproval.findFirst({
        where: { sessionId: updated.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!existingApproval) {
        await prisma.healthOnboardingApproval.create({
          data: {
            sessionId: updated.id,
            entityType: 'onboarding',
            entityId: updated.id,
            requestedBy: 'clinic-admin',
            status: updated.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
            comments:
              updated.status === 'NEEDS_CHANGES'
                ? 'Se solicita corrección antes de aprobar este onboarding.'
                : 'Se requiere revisión humana del flujo clínico antes de publicar.',
          },
        });
      }
    }

    return Response.json({
      clinicId: updated.clinicId,
      currentStep: updated.currentStep,
      status: updated.status,
      progressPercent: updated.progressPercent,
      notes: updated.notes ?? '',
      formData,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid onboarding payload' },
      { status: 400 }
    );
  }
}
