import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';
import { buildActivationChecks } from '@/lib/health/activation';
import { isValidDocumentTypeCode } from '@/lib/health/identity/catalogs';
import { isImplementationIntakeReady } from '@/lib/health/plans';
import { getHealthPlan } from '@/lib/health/plans-enterprise';
import {
  sendServiceActiveEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
  getAppBaseUrl,
} from '@/lib/activation';

function parseSessionForm(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Modelo white-glove IPS:
 * - Cliente llena onboarding (clinico + plan + intake implementacion).
 * - Upway hace implementacion total de la voz dedicada. El canal oficial es
 *   la voz IA sobre linea telefonica: no integramos plataformas de mensajeria.
 * - Este endpoint es el checklist interno de entrega: bloquea ACTIVE
 *   hasta que tenant + plan + datos clinicos + canales + aprobacion esten verdes.
 *
 * GET  /api/health/activate → checklist + canActivate (solo lectura).
 * POST /api/health/activate → si canActivate, pone onboarding ACTIVE + entrega.
 */
async function resolveActivationState(organizationId: string, clinicId: string, userId: string) {
  const clinic = await ensureClinicForId(clinicId, organizationId);
  if (!clinic) throw new Error('No se pudo resolver la clinica.');

  const profile = await ensureHealthProfile(clinic.id);

  const [organization, tienda, triageCount, policiesCount, faqsCount, documentServices, session] = await Promise.all([
    organizationId ? prisma.organization.findUnique({ where: { id: organizationId } }) : null,
    (await prisma.tienda.findFirst({ where: { userId } })) ??
      // Fallback por tenant: SOLO con un filtro real. Sin org/clinic la
      // consulta vacía devolvería la primera Tienda de la tabla (de otro
      // tenant), con su número y su assistant.
      (organizationId || clinicId
        ? await prisma.tienda.findFirst({
            where: {
              ...(organizationId ? { organizationId } : {}),
              ...(clinicId ? { clinicId: clinic.id } : {}),
            },
          })
        : null),
    prisma.healthTriageRule.count({ where: { profileId: profile.id, isActive: true } }),
    prisma.healthCompliancePolicy.count({ where: { profileId: profile.id, isRequired: true } }),
    prisma.healthFAQ.count({ where: { profileId: profile.id, isPublished: true } }),
    // Servicios que exigen documento: base del check de identidad conforme.
    // Solo lee dos columnas: no toca datos de pacientes.
    prisma.serviceOffering.findMany({
      where: {
        organizationId,
        OR: [{ clinicId: clinic.id }, { clinicId: null }],
      },
      select: { requiresDocuments: true, requiredDocumentType: true },
    }),
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
    Boolean(approval) || session?.status === 'APPROVED' || session?.status === 'ACTIVE';

  const formData = parseSessionForm(session?.notes);
  const planId = typeof formData.planId === 'string' ? formData.planId : null;
  const plan = getHealthPlan(planId);
  const implementationIntakeReady = isImplementationIntakeReady(formData);

  // ── Datos clinicos: el cliente los escribe en el wizard (texto libre), no en
  // los modulos de Operaciones. El check no puede exigirle al cliente que ademas
  // los capture dos veces.
  const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  const wizardTriage = hasText(formData.triageRules);
  const wizardPolicies = hasText(formData.policy);
  const wizardFaqs = hasText(formData.faq);

  // ── Identidad conforme: servicios que exigen documento con tipo del catalogo ──
  const servicesRequiringDocs = documentServices.filter((s) => s.requiresDocuments);
  const servicesWithCatalogType = servicesRequiringDocs.filter((s) =>
    isValidDocumentTypeCode(s.requiredDocumentType)
  );

  // ── Los canales de mensajeria de terceros no son parte del paquete ni un
  // canal de Upway: la politica interna los descarta por completo.

  const input = {
    hasOrganization: Boolean(organization ?? organizationId),
    hasClinic: Boolean(clinic),
    hasTienda: Boolean(tienda),
    onboardingStatus: session?.status ?? null,
    voiceActive: Boolean(tienda?.isTelnyxActive ?? tienda?.isVapiActive ?? false),
    hasAssistant: Boolean(tienda?.telnyxAssistantId),
    hasPhone: Boolean(tienda?.telnyxPhoneNumber),
    triageCount,
    policiesCount,
    faqsCount,
    wizardTriage,
    wizardPolicies,
    wizardFaqs,
    clinicallyApproved,
    planId,
    planAutoActivatable: plan ? plan.autoActivatable : false,
    implementationIntakeReady,
    identityServicesRequiringDocs: servicesRequiringDocs.length,
    identityServicesWithCatalogType: servicesWithCatalogType.length,
  };

  const { checks, canActivate } = buildActivationChecks(input);

  return {
    clinic,
    tienda,
    session,
    checks,
    canActivate,
    plan,
    formData,
    counts: { triageCount, policiesCount, faqsCount },
  };
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
        {
          checks: state.checks,
          canActivate: state.canActivate,
          onboardingStatus: state.session?.status ?? null,
          tiendaId: state.tienda?.id ?? null,
          agentVoice: state.tienda?.agentVoice ?? null,
          agentVoiceLabel: state.tienda?.agentVoiceLabel ?? null,
          plan: state.plan
            ? {
                id: state.plan.id,
                name: state.plan.name,
                monthlyCOP: state.plan.monthlyCOP,
                setupCOP: state.plan.setupCOP,
                includedMinutes: state.plan.includedMinutes,
                concurrentCalls: state.plan.concurrentCalls,
                requiresTelnyxApproval: state.plan.requiresTelnyxApproval,
                autoActivatable: state.plan.autoActivatable,
              }
            : null,
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
          {
            ok: false,
            canActivate: false,
            checks: state.checks,
            error: 'IPS no lista: completa implementacion Upway antes del go-live.',
          },
          { organizationId, clinicId: state.clinic.id, role }
        ),
        { status: 409 }
      );
    }

    const updated = await prisma.healthOnboardingSession.update({
      where: { id: state.session.id },
      data: { status: 'ACTIVE', completedAt: new Date(), progressPercent: 100, currentStep: 'go-live' },
    });

    // ── Entrega: correo al cliente con accesos + alerta interna de go-live ──
    const deliveryData = parseSessionForm(state.session.notes);
    const deliveryEmail = String(deliveryData.contactEmail ?? '').trim();

    if (deliveryEmail) {
      const dashboardUrl = `${getAppBaseUrl()}/health`;
      const planName = state.plan?.name ?? 'Upway Health';
      const planMinutes = state.plan ? state.plan.includedMinutes.toLocaleString('es-CO') : '—';
      const planNumbers = state.plan ? String(state.plan.includedNumbers) : '—';
      const planConcurrent = state.plan ? String(state.plan.concurrentCalls) : '—';
      const agentName = state.tienda.agentName ?? state.tienda.nombre;

      after(async () => {
        const clientMail = await sendServiceActiveEmail(deliveryEmail, {
          contactName: String(deliveryData.contactName ?? ''),
          clinicName: state.clinic.name,
          planName,
          dashboardUrl,
          includedMinutes: planMinutes,
          includedNumbers: planNumbers,
          concurrentCalls: planConcurrent,
        });

        await sendInternalActivationAlert(
          UPWAY_INTERNAL_REVIEW_EMAIL,
          'SERVICIO_ACTIVADO',
          `Servicio activo: ${state.clinic.name}`,
          [
            ['Clínica', state.clinic.name],
            ['Agente', agentName],
            ['Plan', planName],
            ['Correo al cliente', clientMail.ok ? 'enviado' : `falló: ${clientMail.error ?? 'N/A'}`],
            ['Siguiente paso', 'Seguimiento post-activación y monitoreo de operación'],
          ]
        );
      });
    }

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
            phoneNumber: state.tienda.telnyxPhoneNumber,
            telnyxAssistantId: state.tienda.telnyxAssistantId,
            voiceActive: state.tienda.isTelnyxActive,
            planId: state.plan?.id ?? null,
            planName: state.plan?.name ?? null,
            panel: '/health',
            operations: '/health/agenda',
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
