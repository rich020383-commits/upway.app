import { NextRequest, NextResponse } from 'next/server';
import { sendHealthOnboardingEmail } from '@/lib/email';
import { getHealthSession } from '@/lib/session';
import { checkRateLimit, rateLimitHeaders, type RateLimitRule } from '@/lib/rate-limit';
import {
  sendActivationReceivedEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
} from '@/lib/activation';

export const runtime = 'nodejs';

/**
 * Cuota de notificaciones por usuario. Enviar es lo caro aquí (SMTP y buzones),
 * así que se limita aunque la sesión sea válida: una sesión comprometida no
 * debe poder inundar el buzón de activación ni los correos de los clientes.
 */
const NOTIFY_RATE_RULE: RateLimitRule = { limit: 5, windowMs: 60_000 };

/** Referencia legible del caso de onboarding (se usa también en el ACK al cliente). */
function buildOnboardingCaseRef(): string {
  return `UPW-ONB-${Date.now().toString(36).toUpperCase()}`;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  // 🔒 AUDITORÍA (pase 3, tenancy): esta ruta NO estaba autenticada.
  //
  // El comentario de aquí decía "la autenticación la cubre el middleware
  // (proxy.ts) para /health/*", pero proxy.ts hace justo lo contrario: deja pasar
  // /api/health/* sin sesión a propósito ("Permitir rutas API de health sin
  // sesión"). Y el único otro filtro, el de origen, no sirve como control de
  // acceso: se salta cuando no hay cabecera Origin (cualquier script o curl) y la
  // lista incluye `https://${host}`, que sale del header Host del cliente.
  //
  // El resultado era un endpoint público que envía correo usando la cuenta de
  // Upway: el ACK va a `formData.contactEmail`, o sea a una dirección que elige
  // quien llama, con el nombre y la clínica que también elige. Eso es un relay de
  // correo abierto (phishing con remitente legítimo) más inundación del buzón
  // interno de activación. Sin sesión y sin cuota, era abusable sin límite.
  //
  // Ahora exige sesión —la página /health/onboarding ya la tiene y manda
  // credentials— y limita por usuario, no por IP: `x-forwarded-for` lo falsifica
  // quien llama, así que la IP no serviría como clave (ver lib/rate-limit.ts).
  const { context, error: sessionError } = await getHealthSession(request);
  if (sessionError) return sessionError;

  const rate = checkRateLimit(`health-notify:${context.user ?? 'anon'}`, NOTIFY_RATE_RULE);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas notificaciones seguidas. Espera un minuto antes de reintentar.',
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  // El origen se conserva como defensa anti-CSRF, NO como autenticación.
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