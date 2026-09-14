import { NextRequest, NextResponse } from 'next/server';
import { sendHealthOnboardingEmail } from '@/lib/email';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  console.log('[notify] ===== INICIO NOTIFICACIÓN =====');
  console.log('[notify] Variables SMTP:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPass: !!process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    review: process.env.UPWAY_REVIEW_EMAIL,
  });

  const user = await getSessionUser(request);
  if (!user) {
    console.log('[notify] No hay sesión activa - usuario no autenticado');
    return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  }
  console.log('[notify] Usuario autenticado:', user.email);

  try {
    const body = await request.json();
    const { formData, clinicName, nit } = body;

    console.log('[notify] Datos recibidos:', {
      clinicName: formData?.clinicName,
      hasFormData: !!formData,
      nit: formData?.nit || nit,
    });

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'Datos de onboarding inválidos' }, { status: 400 });
    }

    const submittedAt = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const emailResult = await sendHealthOnboardingEmail({
      clinicName: formData.clinicName ?? clinicName ?? '',
      legalName: formData.legalName ?? '',
      nit: formData.nit ?? nit ?? '',
      specialty: formData.specialty ?? '',
      location: formData.location ?? '',
      facilityType: formData.facilityType ?? '',
      contactName: formData.contactName ?? '',
      contactPhone: formData.contactPhone ?? '',
      contactEmail: formData.contactEmail ?? '',
      dailyCalls: formData.dailyCalls ?? '',
      avgCallMinutes: formData.avgCallMinutes ?? '',
      planId: formData.planId ?? '',
      preferredAreaCode: formData.preferredAreaCode ?? '',
      existingPhone: formData.existingPhone ?? '',
      crmOrAgenda: formData.crmOrAgenda ?? '',
      careModel: formData.careModel ?? '',
      schedule: formData.schedule ?? '',
      priority: formData.priority ?? '',
      agentName: formData.agentName ?? '',
      mission: formData.mission ?? '',
      triageRules: formData.triageRules ?? '',
      tone: formData.tone ?? '',
      responseStyle: formData.responseStyle ?? '',
      policy: formData.policy ?? '',
      cancellationWindow: formData.cancellationWindow ?? '',
      faq: formData.faq ?? '',
      channel: formData.channel ?? '',
      webhook: formData.webhook ?? '',
      submittedAt,
    });

    console.log('[notify] Resultado envío:', emailResult);

    if (!emailResult.ok && emailResult.error === 'SMTP_NOT_CONFIGURED') {
      return NextResponse.json({
        ok: false,
        warning: 'Correo no configurado. El onboarding se guardó pero no se notificó al equipo.',
      });
    }

    if (!emailResult.ok) {
      return NextResponse.json({
        ok: false,
        warning: 'No se pudo enviar el correo de notificación.',
        detail: emailResult.error,
      });
    }

    console.log('[notify] ===== NOTIFICACIÓN EXITOSA =====');
    return NextResponse.json({ ok: true, message: 'Notificación enviada al equipo de Upway' });
  } catch (err) {
    console.error('[notify] Error procesando notificación:', err);
    return NextResponse.json({ error: 'Error procesando la notificación', detail: String(err) }, { status: 500 });
  }
}
