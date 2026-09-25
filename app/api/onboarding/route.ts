import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';
import {
  stageErrors,
  submissionCompanyName,
  submissionPlanName,
  submissionRows,
  type OnboardingConfig,
} from '@/lib/onboarding/types';
import { sendVerticalOnboardingEmail } from '@/lib/email';
import {
  sendActivationReceivedEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
} from '@/lib/activation';

// nodemailer (correo interno de revisión) necesita el runtime de Node, no Edge.
export const runtime = 'nodejs';

/**
 * Onboarding de verticales no-clínicas (Inmobiliaria / Center).
 *
 * Persistencia real en `VerticalOnboardingSession` (una sesión por usuario y
 * segmento): el avance sobrevive recargas y el envío queda con estado
 * PENDING_REVIEW en base de datos, no solo en el correo. La validación del
 * envío es la misma que la del wizard (stageErrors), server-side.
 *
 * Al enviar a revisión se notifica igual que en Health (/api/health/notify):
 * correo interno detallado al equipo de activación + ACK al cliente + alerta
 * interna del embudo.
 */

const CONFIGS: Record<string, OnboardingConfig> = {
  inmobiliaria: INMOBILIARIA_ONBOARDING,
  center: CENTER_ONBOARDING,
};

/** Estados en los que la solicitud ya salió del borrador: no se degrada. */
const REVIEW_LOCKED_STATUSES: readonly string[] = [
  'PENDING_REVIEW',
  'NEEDS_CHANGES',
  'APPROVED',
  'ACTIVE',
];

type VerticalStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'APPROVED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'ARCHIVED';

/** Respuestas guardadas como JSON: se devuelven solo los valores string. */
function parseAnswers(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** Normaliza el índice de etapa a un rango válido del wizard. */
function clampStep(value: unknown, total: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(Math.max(numeric, 0), Math.max(total - 1, 0));
}

/**
 * Resuelve el usuario real en BD y su tenant. El token de NextAuth puede traer
 * el correo como id (usuarios de Google/LinkedIn), así que se busca por id o
 * email — igual que hace el login al crear el workspace.
 */
async function resolveTenant(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;

  const or: Array<{ id: string } | { email: string }> = [{ id: sessionUser.id }];
  if (sessionUser.email) or.push({ email: sessionUser.email });

  const user = await prisma.user.findFirst({ where: { OR: or }, select: { id: true } });
  if (!user) return null;

  const tienda = await prisma.tienda.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, clinicId: true },
  });

  return {
    userId: user.id,
    organizationId: tienda?.organizationId ?? null,
    clinicId: tienda?.clinicId ?? null,
  };
}

export async function GET(req: NextRequest) {
  const segment = req.nextUrl.searchParams.get('segment') ?? '';
  const config = CONFIGS[segment];
  if (!config) {
    return NextResponse.json({ error: 'invalid_segment' }, { status: 400 });
  }

  const tenant = await resolveTenant(req);
  if (!tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const session = await prisma.verticalOnboardingSession.findUnique({
    where: { userId_segment: { userId: tenant.userId, segment } },
  });

  if (!session) {
    return NextResponse.json({ answers: {}, step: 0, status: null });
  }

  return NextResponse.json({
    answers: parseAnswers(session.answers),
    step: clampStep(session.currentStep, config.stages.length),
    status: session.status,
    caseRef: session.caseRef,
    submittedAt: session.submittedAt?.toISOString() ?? null,
  });
}

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant(req);
  if (!tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    segment?: string;
    answers?: Record<string, string>;
    step?: number;
    stageId?: string;
    submit?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const segment = body.segment ?? '';
  const config = CONFIGS[segment];
  if (!config) {
    return NextResponse.json({ error: 'invalid_segment' }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'invalid_answers' }, { status: 400 });
  }

  // Solo se persiste texto: cualquier otro tipo se descarta antes de guardar.
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.answers)) {
    if (typeof value === 'string') answers[key] = value;
  }

  const total = config.stages.length;
  const currentStep = clampStep(body.step, total);
  const existing = await prisma.verticalOnboardingSession.findUnique({
    where: { userId_segment: { userId: tenant.userId, segment } },
  });

  // Al enviar, validamos todas las etapas en el servidor (misma regla que el cliente).
  if (body.submit) {
    for (const stage of config.stages) {
      const errs = stageErrors(stage, answers);
      if (errs.length > 0) {
        return NextResponse.json({ error: 'incomplete', stageId: stage.id, errors: errs }, { status: 422 });
      }
    }
  }

  // Retroceder en el wizard no degrada una solicitud ya enviada (mismo criterio
  // que Health): sin esto, un "Anterior" devolvía el caso a borrador.
  const status: VerticalStatus = body.submit
    ? 'PENDING_REVIEW'
    : existing && REVIEW_LOCKED_STATUSES.includes(existing.status)
      ? existing.status
      : currentStep > 0
        ? 'IN_PROGRESS'
        : 'DRAFT';

  // El ref del caso es estable entre reintentos: mismo expediente, mismo ref.
  const caseRef = existing?.caseRef ?? `UPW-ONB-${Date.now().toString(36).toUpperCase()}`;
  const submittedAtDate = body.submit ? new Date() : (existing?.submittedAt ?? null);
  const progressPercent = body.submit ? 100 : Math.round((currentStep / total) * 100);
  const persisted = {
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    status,
    currentStep,
    progressPercent,
    answers: JSON.stringify(answers),
    caseRef,
    submittedAt: submittedAtDate,
  };

  // Se persiste ANTES de notificar: si el correo falla, el caso ya no se pierde.
  await prisma.verticalOnboardingSession.upsert({
    where: { userId_segment: { userId: tenant.userId, segment } },
    create: { userId: tenant.userId, segment, ...persisted },
    update: persisted,
  });

  if (!body.submit) {
    return NextResponse.json({ ok: true, status, step: currentStep, caseRef });
  }

  // ── Envío a revisión: el caso ya está guardado; ahora se notifica ──

  // El caso ya quedó guardado arriba; aquí solo se notifica.
  const submittedAtLabel = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const companyName = submissionCompanyName(answers) || 'Sin nombre';
  const planName = submissionPlanName(config, answers);
  const contactEmail = (answers.contactoEmail ?? '').trim();
  const contactName = (answers.encargado ?? '').trim();
  const contactPhone = (answers.contacto ?? '').trim();

  // 1) Correo interno detallado al equipo de activación (mismo destino que Health).
  const emailResult = await sendVerticalOnboardingEmail({
    segmentLabel: config.label,
    companyName,
    planName,
    rows: submissionRows(config, answers),
    contactEmail,
    submittedAt: submittedAtLabel,
  });

  // 2) ACK al cliente: recibimos la solicitud, la verificamos y respondemos.
  let clientNotified = false;
  if (contactEmail) {
    try {
      const clientResult = await sendActivationReceivedEmail(contactEmail, {
        caseRef,
        contactName,
        clinicName: companyName,
        reviewEmail: UPWAY_INTERNAL_REVIEW_EMAIL,
        estimatedResponse: '1–2 días hábiles',
      });
      clientNotified = clientResult.ok;
      if (!clientResult.ok) {
        console.warn('[onboarding] ACK al cliente falló:', clientResult.error);
      }
    } catch (clientError) {
      console.error('[onboarding] Error notificando al cliente:', clientError);
    }
  } else {
    console.warn('[onboarding] Sin contactoEmail: no se envía ACK al cliente.');
  }

  // 3) Alerta interna estructurada (trazabilidad del embudo de activación).
  try {
    await sendInternalActivationAlert(
      UPWAY_INTERNAL_REVIEW_EMAIL,
      'SOLICITUD_RECIBIDA',
      `Nueva solicitud de activación (${config.label}): ${companyName}`,
      [
        ['Vertical', config.label],
        ['Organización', companyName],
        ['Plan', planName || '—'],
        ['Contacto', `${contactName || '—'} · ${contactEmail || 'sin correo'}`],
        ['Teléfono', contactPhone || '—'],
        ['Ref del caso', caseRef],
        ['Correo al cliente', clientNotified ? 'enviado' : contactEmail ? 'falló' : 'sin correo'],
        ['Estado en panel', 'PENDING_REVIEW (guardado en VerticalOnboardingSession)'],
        ['Siguiente paso', 'Verificar caso de uso y responder con confirmación + link de pago Bold'],
      ]
    );
  } catch (alertError) {
    console.error('[onboarding] Alerta interna falló (no bloquea):', alertError);
  }

  // El caso ya vive en base de datos: si el correo no salió, el equipo puede
  // recuperarlo por el ref, así que el aviso es honesto pero no pierde el caso.
  if (!emailResult.ok) {
    return NextResponse.json({
      ok: false,
      status: 'PENDING_REVIEW',
      caseRef,
      clientNotified,
      warning:
        emailResult.error === 'SMTP_NOT_CONFIGURED'
          ? `Correo no configurado: el equipo de Upway no recibió el aviso del caso ${caseRef}. Escríbenos a ${UPWAY_INTERNAL_REVIEW_EMAIL}.`
          : `No se pudo enviar el correo de notificación al equipo de Upway (caso ${caseRef}).`,
      detail: emailResult.error,
    });
  }

  return NextResponse.json({ ok: true, status: 'PENDING_REVIEW', caseRef, clientNotified });
}