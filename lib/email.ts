import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST ?? '';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const SMTP_FROM = process.env.SMTP_FROM ?? 'Upway Health <activacionplan@upway.business>';
const UPWAY_REVIEW_EMAIL = process.env.UPWAY_REVIEW_EMAIL ?? 'activacionplan@upway.business';

export interface HealthOnboardingEmailData {
  clinicName: string;
  legalName: string;
  nit: string;
  specialty: string;
  location: string;
  facilityType: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  dailyCalls: string;
  avgCallMinutes: string;
  planId: string;
  preferredAreaCode: string;
  existingPhone: string;
  crmOrAgenda: string;
  careModel: string;
  schedule: string;
  priority: string;
  agentName: string;
  mission: string;
  triageRules: string;
  tone: string;
  responseStyle: string;
  policy: string;
  cancellationWindow: string;
  faq: string;
  channel: string;
  webhook: string;
  submittedAt: string;
}

function buildRowsHtml(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;white-space:nowrap;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${value}</td></tr>`
    )
    .join('');
}

function buildHealthOnboardingEmailHtml(data: HealthOnboardingEmailData): string {
  const rows: Array<[string, string]> = [
    ['Nombre comercial', data.clinicName || '—'],
    ['Raz\u00f3n social', data.legalName || '—'],
    ['NIT', data.nit || '—'],
    ['Especialidad', data.specialty || '—'],
    ['Ubicaci\u00f3n', data.location || '—'],
    ['Tipo de sede', data.facilityType || '—'],
    ['Nombre de contacto', data.contactName || '—'],
    ['Tel\u00e9fono de contacto', data.contactPhone || '—'],
    ['Email de contacto', data.contactEmail || '—'],
    ['Llamadas diarias estimadas', data.dailyCalls || '—'],
    ['Duraci\u00f3n promedio (min)', data.avgCallMinutes || '—'],
    ['Plan seleccionado', data.planId || '—'],
    ['Indicativo preferido', data.preferredAreaCode || '—'],
    ['N\u00famero a portar', data.existingPhone || '—'],
    ['CRM/Agenda actual', data.crmOrAgenda || '—'],
    ['Modelo de atenci\u00f3n', data.careModel || '—'],
    ['Horario', data.schedule || '—'],
    ['Prioridad', data.priority || '—'],
    ['Nombre del agente', data.agentName || '—'],
    ['Misi\u00f3n del agente', data.mission || '—'],
    ['Reglas de triaje', data.triageRules || '—'],
    ['Tono', data.tone || '—'],
    ['Estilo de respuesta', data.responseStyle || '—'],
    ['Pol\u00edtica', data.policy || '—'],
    ['Ventana de cancelaci\u00f3n', data.cancellationWindow || '—'],
    ['FAQ', data.faq || '—'],
    ['Canal', data.channel || '—'],
    ['Webhook', data.webhook || '—'],
  ];

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>Nuevo Onboarding Health - ${data.clinicName}</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;padding:24px;">
<tr><td style="padding-bottom:24px;">
  <div style="display:inline-flex;align-items:center;gap:12px;padding:12px 18px;border-radius:14px;background:linear-gradient(135deg,#0d1727 0%,#122841 100%);color:white;">
    <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;">UPW<span style="color:#50e1d5;">\u25b2</span>Y</span>
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;opacity:0.8;">Health Onboarding</span>
  </div>
</td></tr>
<tr><td style="padding:24px;background:white;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,39,0.04);">
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">Nuevo caso de onboarding Health</h1>
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Se ha recibido una nueva solicitud de onboarding para revisi\u00f3n:</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><tbody>
    ${buildRowsHtml(rows)}
    <tr><td style="padding:8px 12px;font-weight:600;color:#334155;background:#f8fafc;">Fecha de env\u00edo</td><td style="padding:8px 12px;color:#0f172a;background:#f8fafc;">${data.submittedAt}</td></tr>
  </tbody></table>
  <div style="margin-top:24px;padding:16px;border-radius:12px;background:#edf5ff;border:1px solid #d3e2ff;">
    <p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">\u26a1 Pr\u00f3ximos pasos</p>
    <ol style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#36557c;line-height:1.7;">
      <li>Revisar completitud del caso y datos de contacto.</li>
      <li>Contactar a <strong>${data.contactName || 'la cl\u00ednica'}</strong> en <strong>${data.contactPhone || data.contactEmail || '\u2014'}</strong> para agendar kickoff.</li>
      <li>Definir costo de implementaci\u00f3n y opciones de recarga.</li>
      <li>Actualizar estado del onboarding en el panel admin.</li>
    </ol>
  </div>
</td></tr>
<tr><td style="padding-top:16px;text-align:center;font-size:11px;color:#94a3b8;">Upway Business Group S.A.S \u00b7 Correo generado autom\u00e1ticamente</td></tr>
</table></body></html>`;
}

function buildHealthOnboardingEmailText(data: HealthOnboardingEmailData): string {
  const lines = [
    `Nuevo caso de onboarding Health - ${data.clinicName}`,
    '='.repeat(50),
    '',
    'DATOS DE LA CLÍNICA:',
    `  Nombre comercial: ${data.clinicName || '—'}`,
    `  Razón social: ${data.legalName || '—'}`,
    `  NIT: ${data.nit || '—'}`,
    `  Especialidad: ${data.specialty || '—'}`,
    `  Ubicación: ${data.location || '—'}`,
    `  Tipo de sede: ${data.facilityType || '—'}`,
    '',
    'DATOS DE CONTACTO:',
    `  Nombre: ${data.contactName || '—'}`,
    `  Teléfono: ${data.contactPhone || '—'}`,
    `  Email: ${data.contactEmail || '—'}`,
    '',
    'OPERACIÓN:',
    `  Llamadas diarias: ${data.dailyCalls || '—'}`,
    `  Duración promedio: ${data.avgCallMinutes || '—'} min`,
    `  Plan: ${data.planId || '—'}`,
    `  Indicativo: ${data.preferredAreaCode || '—'}`,
    `  CRM/Agenda: ${data.crmOrAgenda || '—'}`,
    `  Modelo de atención: ${data.careModel || '—'}`,
    '',
    'CONFIGURACIÓN DEL AGENTE:',
    `  Nombre del agente: ${data.agentName || '—'}`,
    `  Tono: ${data.tone || '—'}`,
    `  Estilo: ${data.responseStyle || '—'}`,
    '',
    `Enviado: ${data.submittedAt}`,
  ];

  return lines.join('\n');
}

function createTransporter() {
  console.log('[email] SMTP Config:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    hasPassword: !!SMTP_PASS,
    from: SMTP_FROM,
    reviewEmail: UPWAY_REVIEW_EMAIL,
  });

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[email] SMTP incompleto. Host:', !!SMTP_HOST, 'User:', !!SMTP_USER, 'Pass:', !!SMTP_PASS);
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendHealthOnboardingEmail(
  data: HealthOnboardingEmailData
): Promise<{ ok: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[email] SMTP no configurado. Saltando envío de correo de onboarding.');
    return { ok: false, error: 'SMTP_NOT_CONFIGURED' };
  }

  const subject = `[Onboarding Health] ${data.clinicName || 'Nueva clínica'} - ${data.nit || 'Sin NIT'}`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: UPWAY_REVIEW_EMAIL,
      subject,
      text: buildHealthOnboardingEmailText(data),
      html: buildHealthOnboardingEmailHtml(data),
      replyTo: data.contactEmail || undefined,
    });

    return { ok: true };
  } catch (error) {
    console.error('[email] Error enviando correo de onboarding:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' };
  }
}

/**
 * Envío genérico de correo transaccional (flujo de activación y otros).
 * Devuelve ok=false (no lanza) si SMTP no está configurado o falla el envío:
 * el flujo de negocio nunca debe romperse por un correo.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[email] SMTP no configurado. Saltando envío a:', input.to);
    return { ok: false, error: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: input.replyTo || undefined,
    });
    return { ok: true };
  } catch (error) {
    console.error('[email] Error enviando correo a', input.to, ':', error);
    return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' };
  }
}

