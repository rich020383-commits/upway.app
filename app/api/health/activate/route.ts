import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';
import { buildActivationChecks } from '@/lib/health/activation';

/**
 * Modelo white-glove IPS:
 * - Cliente llena poco (onboarding health: datos clínicos).
 * - Upway hace implementación total (WhatsApp Meta + voz Telnyx dedicada).
 * - Este endpoint es el checklist interno de entrega: bloquea ACTIVE
 *   hasta que tenant + datos clínicos + canales + aprobación estén verdes.
 *
 * GET  /api/health/activate → checklist + canActivate (solo lectura).
 * POST /api/health/activate → si canActivate, pone onboarding ACTIVE + entrega.
 */
async function resolveActivationState(organizationId: string, clinicId: string, userId: string) {
  const clinic = await ensureClinicForId(clinicId, organizationId);
  if (!clinic) throw new Error('No se pudo resolver la clínica.');

  const profile = await ensureHealthProfile(clinic.id);

  const [organization, tienda, triageCount, policiesCount, faqsCount, session] = await Promise.all([
    organizationId ? prisma.organization.findUnique({ where: { id: organizationId } }) : null,
    (
      await prisma.tienda.findFirst({ where: { userId } })
    ) ??
      (await prisma.tienda.findFirst({
        where: {
          ...(organizationId ? { organizationId } : {}),
          ...(clinicId ? { clinicId: clinic.id } : {}),
        },
      })),
    prisma.healthTriageRule.count({ where: { profileId: profile.id, isActive: true } }),
    prisma.healthCompliancePolicy.count({ where: { profileId: profile.id, isRequired: true } }),
    prisma.healthFAQ.count({ where: { profileId: profile.id, isPublished: true } }),
    prisma.healthOnboardingSession.findFirst({
      where: { clinicId: clinic.id },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const approval = session
    ? await prisma.healthOnboardingApproval.findFirst({
        where: { sessionId: session.id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  const clinicallyApproved =
    Boolean(approval) || (session?.status === 'APPROVED' || session?.status === 'ACTIVE');

  const input = {
    hasOrganization: Boolean(organization ?? organizationId),
    hasClinic: Boolean(clinic),
    hasTienda: Boolean(tienda),
    onboardingStatus: session?.status ?? null,
    whatsappActive: Boolean(tienda?.isWhatsAppActive),
    voiceActive: Boolean(tienda?.isTelnyxActive ?? tienda?.isVapiActive ?? false),
    hasAssistant: Boolean(tienda?.telnyxAssistantId),
    hasPhone: Boolean(tienda?.telnyxPhoneNumber),
    triageCount,
    policiesCount,
    faqsCount,
    clinicallyApproved,
  };

  const { checks, canActivate } = buildActivationChecks(input);

  return { clinic, tienda, session, checks, canActivate, counts: { triageCount, policiesCount, faqsCount } };
}

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;
  const { role, organizationId, clinicId } = context;
  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
    const state = await resolveActivationState(organizationId, clinicId, context.user.id);
    return NextResponse.json(
      withTenantScope(
        { checks: state.checks, canActivate: state.canActivate, onboardingStatus: state.session?.status ?? null },
        { organizationId, clinicId: state.clinic.id, role }
      )
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;
  const { role, organizationId, clinicId } = context;
  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
    const state = await resolveActivationState(organizationId, clinicId, context.user.id);
    if (!state.canActivate || !state.session || !state.tienda) {
      return NextResponse.json(
        withTenantScope(
          { ok: false, canActivate: false, checks: state.checks, error: 'IPS no lista: completa implementación Upway antes del go-live.' },
          { organizationId, clinicId: state.clinic.id, role }
        ),
        { status: 409 }
      );
    }

    const updated = await prisma.healthOnboardingSession.update({
      where: { id: state.session.id },
      data: { status: 'ACTIVE', completedAt: new Date(), progressPercent: 100, currentStep: 'go-live' },
    });

    return NextResponse.json(
      withTenantScope(
        {
          ok: true,
          canActivate: true,
          checks: state.checks,
          onboardingStatus: updated.status,
          delivery: {
            clinicId: state.clinic.id,
            clinicName: state.clinic.name,
            agentName: state.tienda.agentName ?? state.tienda.nombre,
            telnyxPhoneNumber: state.tienda.telnyxPhoneNumber,
            telnyxAssistantId: state.tienda.telnyxAssistantId,
            whatsappActive: state.tienda.isWhatsAppActive,
            voiceActive: state.tienda.isTelnyxActive,
            panel: '/health',
            operations: '/dashboard/operaciones',
          },
        },
        { organizationId, clinicId: state.clinic.id, role }
      )
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}
