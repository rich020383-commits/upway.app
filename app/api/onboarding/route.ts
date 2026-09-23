import { NextRequest, NextResponse } from 'next/server';
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
 * Valida el envío server-side reutilizando las mismas reglas que el wizard
 * (stageErrors) y responde el estado. La persistencia por usuario queda
 * pendiente de su modelo en Prisma (VerticalOnboardingSession); mientras
 * tanto, el wizard guarda su avance en cliente y trata el guardado como
 * best-effort.
 *
 * Al enviar a revisión se notifica igual que en Health (/api/health/notify):
 * correo interno detallado al equipo de activación + ACK al cliente + alerta
 * interna del embudo. Antes, el envío moría en el cliente y nadie se enteraba.
 */

const CONFIGS: Record<string, OnboardingConfig> = {
  inmobiliaria: INMOBILIARIA_ONBOARDING,
  center: CENTER_ONBOARDING,
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const segment = req.nextUrl.searchParams.get('segment') ?? '';
  if (!(segment in CONFIGS)) {
    return NextResponse.json({ error: 'invalid_segment' }, { status: 400 });
  }

  // Sin persistencia server-side aún: el wizard empieza en blanco.
  return NextResponse.json({ answers: {}, step: 0 });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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

  // Al enviar, validamos todas las etapas en el servidor (misma regla que el cliente).
  if (body.submit) {
    for (const stage of config.stages) {
      const errs = stageErrors(stage, body.answers);
      if (errs.length > 0) {
        return NextResponse.json({ error: 'incomplete', stageId: stage.id, errors: errs }, { status: 422 });
      }
    }

    // TODO(persistencia): guardar PENDING_REVIEW cuando exista VerticalOnboardingSession.
    // Mientras tanto, la solicitud queda trazada por correo (igual que Health).
    const answers = body.answers as Record<string, string>;
    const submittedAt = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const caseRef = `UPW-ONB-${Date.now().toString(36).toUpperCase()}`;
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
      submittedAt,
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
          ['Siguiente paso', 'Verificar caso de uso y responder con confirmación + link de pago Bold'],
        ]
      );
    } catch (alertError) {
      console.error('[onboarding] Alerta interna falló (no bloquea):', alertError);
    }

    // El correo es hoy la única trazabilidad del caso: si no salió, lo decimos
    // explícitamente en vez de simular un envío que nadie recibió.
    if (!emailResult.ok) {
      return NextResponse.json({
        ok: false,
        status: 'PENDING_REVIEW',
        caseRef,
        clientNotified,
        warning:
          emailResult.error === 'SMTP_NOT_CONFIGURED'
            ? `Correo no configurado: el equipo de Upway no recibió el caso. Escríbenos a ${UPWAY_INTERNAL_REVIEW_EMAIL}.`
            : 'No se pudo enviar el correo de notificación al equipo de Upway.',
        detail: emailResult.error,
      });
    }

    return NextResponse.json({ ok: true, status: 'PENDING_REVIEW', caseRef, clientNotified });
  }

  return NextResponse.json({ ok: true, status: 'DRAFT' });
}