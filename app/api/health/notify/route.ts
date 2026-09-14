import { NextRequest, NextResponse } from 'next/server';
import { sendHealthOnboardingEmail } from '@/lib/email';
import {
  sendActivationReceivedEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
} from '@/lib/activation';

export const runtime = 'nodejs';

/** Referencia legible del caso de onboarding (se usa también en el ACK al cliente). */
function buildOnboardingCaseRef(): string {
  return `UPW-ONB-${Date.now().toString(36).toUpperCase()}`;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  // Nota: la autenticación la cubre el middleware (proxy.ts) para /health/*.
  // Validación anti-abuso básica por origen:
  const origin = request.headers.get('origin') ?? '';
  const host = request.headers.get('host') ?? '';
  const allowedOrigins = [
    `https://${host}`,
    'https://upway.business',
    'https://www.upway.business',
  ];

  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    console.warn('[notify] Origen no permitido:', origin);
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { formData, clinicName, nit } = body ?? {};

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'Datos de onboarding inválidos' }, { status: 400 });
    }

    const submittedAt = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // 1) Notificación interna al equipo de activación (detalle completo del onboarding)
    const emailResult = await sendHealthOnboardingEmail({
      clinicName: str(formData.clinicName) || str(clinicName),
      legalName: str(formData.legalName),
      nit: str(formData.nit) || str(nit),
      specialty: str(formData.specialty),
      location: str(formData.location),
      facilityType: str(formData.facilityType),
      contactName: str(formData.contactName),
      contactPhone: str(formData.contactPhone),
      contactEmail: str(formData.contactEmail),
      dailyCalls: str(formData.dailyCalls),
      avgCallMinutes: str(formData.avgCallMinutes),
      planId: str(formData.planId),
      preferredAreaCode: str(formData.preferredAreaCode),
      existingPhone: str(formData.existingPhone),
      crmOrAgenda: str(formData.crmOrAgenda),
      careModel: str(formData.careModel),
      schedule: str(formData.schedule),
      priority: str(formData.priority),
      agentName: str(formData.agentName),
      mission: str(formData.mission),
      triageRules: str(formData.triageRules),
      tone: str(formData.tone),
      responseStyle: str(formData.responseStyle),
      policy: str(formData.policy),
      cancellationWindow: str(formData.cancellationWindow),
      faq: str(formData.faq),
      channel: str(formData.channel),
      webhook: str(formData.webhook),
      submittedAt,
    });

    // 2) ACK al cliente: recibimos tu solicitud, la verificamos y te respondemos.
    // No bloquea la respuesta del onboarding si el correo falla.
    let clientNotified = false;
    let caseRef: string | null = null;
    const clientEmail = str(formData.contactEmail);

    if (clientEmail) {
      caseRef = buildOnboardingCaseRef();
      try {
        const clientResult = await sendActivationReceivedEmail(clientEmail, {
          caseRef,
          contactName: str(formData.contactName),
          clinicName: str(formData.clinicName) || str(clinicName) || 'tu organización',
          reviewEmail: UPWAY_INTERNAL_REVIEW_EMAIL,
          estimatedResponse: '1–2 días hábiles',
        });
        clientNotified = clientResult.ok;
        if (!clientResult.ok) {
          console.warn('[notify] Correo de solicitud recibida falló para el cliente:', clientResult.error);
        }
      } catch (clientError) {
        console.error('[notify] Error notificando al cliente:', clientError);
      }
    } else {
      console.warn('[notify] El onboarding no tiene contactEmail; no se envía ACK al cliente.');
    }

    if (!emailResult.ok && emailResult.error === 'SMTP_NOT_CONFIGURED') {
      return NextResponse.json({
        ok: false,
        warning: 'Correo no configurado. El onboarding se guardó pero no se notificó al equipo.',
        caseRef,
      });
    }

    if (!emailResult.ok) {
      return NextResponse.json({
        ok: false,
        warning: 'No se pudo enviar el correo de notificación.',
        detail: emailResult.error,
        caseRef,
      });
    }

    // 3) Alerta interna estructurada (trazabilidad del embudo de activación)
    try {
      await sendInternalActivationAlert(
        UPWAY_INTERNAL_REVIEW_EMAIL,
        'SOLICITUD_RECIBIDA',
        `Nueva solicitud de activación: ${str(formData.clinicName) || str(clinicName) || 'N/A'}`,
        [
          ['Clínica', str(formData.clinicName) || str(clinicName) || '—'],
          ['NIT', str(formData.nit) || str(nit) || '—'],
          ['Contacto', `${str(formData.contactName) || '—'} · ${clientEmail || 'sin correo'}`],
          ['Teléfono', str(formData.contactPhone) || '—'],
          ['Plan', str(formData.planId) || '—'],
          ['Ref del caso', caseRef ?? '—'],
          ['Correo al cliente', clientNotified ? 'enviado' : clientEmail ? 'falló' : 'sin correo'],
          ['Siguiente paso', 'Verificar caso de uso y responder con confirmación + link de pago Bold'],
        ]
      );
    } catch (alertError) {
      console.error('[notify] Alerta interna falló (no bloquea):', alertError);
    }

    return NextResponse.json({
      ok: true,
      message: 'Notificación enviada al equipo de Upway',
      clientNotified,
      caseRef,
    });
  } catch (err) {
    console.error('[notify] Error procesando notificación:', err);
    return NextResponse.json({ error: 'Error procesando la notificación', detail: String(err) }, { status: 500 });
  }
}