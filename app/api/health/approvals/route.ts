import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { getHealthSession } from '@/lib/session';
import {
  createActivationPaymentLink,
  sendActivationApprovedEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
  formatCopLabel,
} from '@/lib/activation';
import { getHealthPlan, planCommercialSummary } from '@/lib/health/plans-enterprise';
import { isBoldConfigured } from '@/lib/billing/bold';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

type ApprovalItem = {
  id: string;
  sessionId: string;
  clinicId: string;
  title: string;
  summary: string;
  status: ApprovalStatus;
  reviewer: string;
  requestedBy: string;
  createdAt: string;
  reviewedAt?: string | null;
  entityType: string;
  entityId: string;
};

function normalizeApprovalStatus(value: string | undefined): ApprovalStatus {
  const normalized = String(value ?? 'PENDING').trim().toUpperCase();

  if (normalized === 'APPROVED') return 'APPROVED';
  if (normalized === 'REJECTED') return 'REJECTED';
  if (normalized === 'CHANGES_REQUESTED' || normalized === 'NEEDS_CHANGES') return 'CHANGES_REQUESTED';

  return 'PENDING';
}

function mapSessionStatusToApprovalStatus(status?: string): ApprovalStatus {
  switch (status) {
    case 'APPROVED':
      return 'APPROVED';
    case 'BLOCKED':
      return 'REJECTED';
    case 'NEEDS_CHANGES':
      return 'CHANGES_REQUESTED';
    case 'PENDING_REVIEW':
    default:
      return 'PENDING';
  }
}

function parseSessionNotes(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(formData: Record<string, unknown>, key: string): string {
  const value = formData[key];
  return typeof value === 'string' ? value.trim() : '';
}

async function resolveClinic(clinicId?: string, organizationId?: string) {
  if (clinicId && clinicId !== 'default-clinic') {
    return prisma.clinic.findUnique({ where: { id: clinicId } });
  }

  if (organizationId && organizationId !== 'default-org') {
    return prisma.clinic.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.clinic.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

async function loadApprovals(clinicId?: string, organizationId?: string): Promise<ApprovalItem[]> {
  const clinic = await resolveClinic(clinicId, organizationId);

  if (!clinic) {
    return [];
  }

  const sessions = await prisma.healthOnboardingSession.findMany({
    where: { clinicId: clinic.id },
    include: { approvals: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
    take: 50, // Solo interesan las sesiones recientes para la bandeja de aprobaciones
  });

  if (!sessions.length) {
    return [];
  }

  const items = sessions.flatMap((session) => {
    const approvals = session.approvals.length
      ? session.approvals
      : [
          {
            id: session.id,
            sessionId: session.id,
            entityType: 'onboarding',
            entityId: session.id,
            requestedBy: 'clinic-admin',
            approvedBy: null,
            status: mapSessionStatusToApprovalStatus(session.status),
            comments: session.notes ?? 'Se requiere validación del responsable clínico antes de autorizar el lanzamiento del flujo.',
            createdAt: session.createdAt,
            reviewedAt: null,
          },
        ];

    return approvals.map((approval) => ({
      id: approval.id,
      sessionId: approval.sessionId ?? session.id,
      clinicId: session.clinicId,
      title: `Revisión de ${session.currentStep.replace(/-/g, ' ')}`,
      summary:
        approval.comments && approval.comments.trim().length > 0
          ? approval.comments
          : session.notes || 'Se requiere validación manual del responsable antes de publicar esta configuración clínica.',
      status: normalizeApprovalStatus(approval.status),
      reviewer: approval.approvedBy ?? 'Compliance',
      requestedBy: approval.requestedBy ?? 'clinic-admin',
      createdAt: approval.createdAt.toISOString(),
      reviewedAt: approval.reviewedAt ? approval.reviewedAt.toISOString() : null,
      entityType: approval.entityType ?? 'onboarding',
      entityId: approval.entityId ?? session.id,
    }));
  });

  return items;
}

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'approvals', organizationId, clinicId });

    const items = await loadApprovals(clinicId, organizationId);
    return NextResponse.json(withTenantScope({ items }, { organizationId, clinicId, role }));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId, user } = context;

  try {
    enforceHealthAccess({ role, module: 'approvals', organizationId, clinicId });

    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: unknown;
      action?: unknown;
      comments?: unknown;
    };

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const action = String(body.action ?? 'APPROVED').trim().toUpperCase();
    const comments = typeof body.comments === 'string' ? body.comments.trim() : '';

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId es requerido' }, { status: 400 });
    }

    const session = await prisma.healthOnboardingSession.findUnique({
      where: { id: sessionId },
      include: { approvals: { orderBy: { createdAt: 'desc' } } },
    });

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Sesión de onboarding no encontrada' }, { status: 404 });
    }

    // Scope de tenant: la sesión debe pertenecer a la clínica del revisor.
    if (clinicId && session.clinicId !== clinicId) {
      return NextResponse.json({ ok: false, error: 'Sesión fuera de tu organización' }, { status: 404 });
    }

    const approval =
      session.approvals[0] ??
      (await prisma.healthOnboardingApproval.create({
        data: {
          sessionId: session.id,
          entityType: 'onboarding',
          entityId: session.id,
          requestedBy: 'clinic-admin',
          status: 'PENDING',
          comments: 'Se requiere revisión humana del flujo clínico antes de publicar.',
        },
      }));

    const reviewedAt = new Date();

    if (action === 'REJECTED' || action === 'CHANGES_REQUESTED' || action === 'NEEDS_CHANGES') {
      const approvalStatus = action === 'REJECTED' ? 'REJECTED' : 'CHANGES_REQUESTED';
      const sessionStatus = action === 'REJECTED' ? 'BLOCKED' : 'NEEDS_CHANGES';

      await prisma.$transaction([
        prisma.healthOnboardingApproval.update({
          where: { id: approval.id },
          data: {
            status: approvalStatus,
            approvedBy: user.id,
            reviewedAt,
            comments: comments || 'Se solicitan correcciones antes de aprobar este onboarding.',
          },
        }),
        prisma.healthOnboardingSession.update({
          where: { id: session.id },
          data: { status: sessionStatus },
        }),
      ]);

      return NextResponse.json(
        withTenantScope(
          { ok: true, status: approvalStatus, paymentUrl: null },
          { organizationId, clinicId: session.clinicId, role },
        ),
      );
    }

    if (action !== 'APPROVED') {
      return NextResponse.json({ ok: false, error: `Acción no soportada: ${action}` }, { status: 400 });
    }

    const formData = parseSessionNotes(session.notes);

    return approveAndCreatePaymentLink({
      sessionId: session.id,
      sessionClinicId: session.clinicId,
      approvalId: approval.id,
      planId: str(formData, 'planId'),
      contactEmail: str(formData, 'contactEmail'),
      contactName: str(formData, 'contactName'),
      clinicName: str(formData, 'clinicName'),
      comments,
      userId: user.id,
      organizationId,
      role,
    });
  } catch (err) {
    console.error('[approvals] Error procesando la aprobación:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 },
    );
  }
}

// --- Aprobación → link de pago Bold (solo planes Health auto-activables) ---
async function approveAndCreatePaymentLink(args: {
  sessionId: string;
  sessionClinicId: string;
  approvalId: string;
  planId: string;
  contactEmail: string;
  contactName: string;
  clinicName: string;
  comments: string;
  userId: string;
  organizationId: string;
  role: string;
}): Promise<NextResponse> {
  const {
    sessionId,
    sessionClinicId,
    approvalId,
    planId,
    contactEmail,
    contactName,
    clinicName,
    comments,
    userId,
    organizationId,
    role,
  } = args;

  if (!contactEmail) {
    return NextResponse.json(
      { ok: false, error: 'El onboarding no tiene correo de contacto para enviar el link de pago.' },
      { status: 400 },
    );
  }

  if (!planId) {
    return NextResponse.json(
      { ok: false, error: 'El onboarding no tiene plan seleccionado (planId).' },
      { status: 400 },
    );
  }

  if (!isBoldConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Bold no está configurado en el entorno; no se puede generar el link de pago.' },
      { status: 503 },
    );
  }

  const payment = await createActivationPaymentLink({
    planId,
    customerEmail: contactEmail,
    customerName: contactName || null,
    userId,
    organizationId: organizationId || null,
    clinicId: sessionClinicId,
    sessionId,
  });

  if (!payment.ok) {
    // Planes custom (p.ej. eps-custom) llegan aquí con 400 del catálogo:
    // se cotizan por deal desk y no admiten pago por link.
    return NextResponse.json(
      { ok: false, error: payment.error },
      { status: payment.status === 503 ? 503 : 400 },
    );
  }

  const reviewedAt = new Date();

  await prisma.$transaction([
    prisma.healthOnboardingApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        reviewedAt,
        comments:
          comments ||
          `Caso de uso aprobado. Link de pago Bold generado (ref ${payment.reference}).`,
      },
    }),
    prisma.healthOnboardingSession.update({
      where: { id: sessionId },
      data: { status: 'APPROVED' },
    }),
  ]);

  // Correos fuera de la ruta crítica: aprobado al cliente (+ botón Bold) y alerta interna.
  after(async () => {
    const clientMail = await sendActivationApprovedEmail(contactEmail, {
      caseRef: payment.reference,
      contactName,
      clinicName: clinicName || 'tu organización',
      planName: payment.planName,
      monthlyLabel: payment.pricing.monthlyLabel,
      ivaLabel: payment.pricing.ivaLabel || 'Incluido en el precio',
      setupLabel: payment.pricing.setupLabel,
      totalLabel: formatCopLabel(payment.amountCOP),
      paymentUrl: payment.paymentUrl,
      reference: payment.reference,
    });

    await sendInternalActivationAlert(
      UPWAY_INTERNAL_REVIEW_EMAIL,
      'CASO_APROBADO',
      `Caso aprobado con link de pago: ${payment.planName} (${payment.reference})`,
      [
        ['Referencia', payment.reference],
        ['Plan', payment.planName],
        ['Total con IVA', formatCopLabel(payment.amountCOP)],
        ['Cliente', `${contactName || '—'} · ${contactEmail}`],
        ['Correo al cliente', clientMail.ok ? 'enviado' : `falló: ${clientMail.error ?? 'N/A'}`],
        ['Siguiente paso', 'Esperar pago (webhook Bold) e iniciar implementación'],
      ],
    );
  });

  return NextResponse.json(
    withTenantScope(
      {
        ok: true,
        status: 'APPROVED',
        paymentUrl: payment.paymentUrl,
        reference: payment.reference,
        planId,
        planName: payment.planName,
        amountCOP: payment.amountCOP,
      },
      { organizationId, clinicId: sessionClinicId, role },
    ),
  );
}