import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

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

const fallbackApprovals: ApprovalItem[] = [
  {
    id: 'demo-approval-1',
    sessionId: 'demo-session-1',
    clinicId: 'demo-clinic',
    title: 'Política de cancelación y reprogramación',
    summary: 'Se solicita aprobación para soportar reprogramación asistida con ventana de 24 horas y escalamiento manual si el paciente reporta dolor agudo.',
    status: 'PENDING',
    reviewer: 'Compliance',
    requestedBy: 'clinic-admin',
    createdAt: new Date().toISOString(),
    entityType: 'onboarding',
    entityId: 'demo-session-1',
  },
  {
    id: 'demo-approval-2',
    sessionId: 'demo-session-2',
    clinicId: 'demo-clinic',
    title: 'Triage de urgencias y duplicación de casos',
    summary: 'Validación del escalamiento automático cuando el paciente indica dolor intenso, sangrado o pérdida de conocimiento.',
    status: 'CHANGES_REQUESTED',
    reviewer: 'Ops',
    requestedBy: 'triage-manager',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    entityType: 'onboarding',
    entityId: 'demo-session-2',
  },
  {
    id: 'demo-approval-3',
    sessionId: 'demo-session-3',
    clinicId: 'demo-clinic',
    title: 'FAQ de coordinación y agenda',
    summary: 'Aprobación del conjunto de respuestas rápidas para agendamiento, no-show, confirmación y cancelación con apoyo humano.',
    status: 'APPROVED',
    reviewer: 'Admin',
    requestedBy: 'clinic-admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    entityType: 'onboarding',
    entityId: 'demo-session-3',
  },
];

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
    return fallbackApprovals;
  }

  const sessions = await prisma.healthOnboardingSession.findMany({
    where: { clinicId: clinic.id },
    include: { approvals: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  if (!sessions.length) {
    return fallbackApprovals;
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

  return items.length ? items : fallbackApprovals;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'compliance-reviewer';
  const organizationId = searchParams.get('organizationId') ?? 'org-1';
  const clinicId = searchParams.get('clinicId') ?? 'clinic-1';

  try {
    enforceHealthAccess({ role, module: 'approvals', organizationId, clinicId });

    const items = await loadApprovals(clinicId, organizationId);
    return Response.json(withTenantScope({ items }, { organizationId, clinicId, role }));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const role = String(body.role ?? 'compliance-reviewer');
  const organizationId = String(body.organizationId ?? 'org-1');
  const clinicId = String(body.clinicId ?? 'clinic-1');
  const approvalId = String(body.id ?? '');
  const requestedAction = normalizeApprovalStatus(body.action ?? body.status ?? 'PENDING');
  const comments = String(body.comments ?? 'Aprobación actualizada por revisión humana.');
  const reviewedBy = String(body.reviewedBy ?? role);

  try {
    enforceHealthAccess({ role, module: 'approvals', organizationId, clinicId });

    if (!approvalId) {
      return Response.json({ error: 'Approval id is required.' }, { status: 400 });
    }

    const existingApproval = await prisma.healthOnboardingApproval.findUnique({
      where: { id: approvalId },
    });

    if (!existingApproval) {
      return Response.json({ error: 'Approval record not found.' }, { status: 404 });
    }

    const updatedApproval = await prisma.healthOnboardingApproval.update({
      where: { id: approvalId },
      data: {
        status: requestedAction,
        approvedBy: reviewedBy,
        comments,
        reviewedAt: new Date(),
      },
    });

    const session = await prisma.healthOnboardingSession.findUnique({
      where: { id: existingApproval.sessionId },
    });

    if (session) {
      const nextSessionStatus =
        requestedAction === 'APPROVED'
          ? 'APPROVED'
          : requestedAction === 'REJECTED'
            ? 'BLOCKED'
            : requestedAction === 'CHANGES_REQUESTED'
              ? 'NEEDS_CHANGES'
              : session.status;

      await prisma.healthOnboardingSession.update({
        where: { id: session.id },
        data: {
          status: nextSessionStatus,
          currentStep: 'review-and-approve',
          notes: comments || session.notes || 'Estado actualizado por revisión de aprobación.',
          updatedAt: new Date(),
        },
      });
    }

    return Response.json({
      success: true,
      item: {
        id: updatedApproval.id,
        status: requestedAction,
        reviewer: reviewedBy,
        comments,
        reviewedAt: updatedApproval.reviewedAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Approval action rejected',
      },
      { status: 403 },
    );
  }
}
