/**
 * Plantillas de correo del flujo de activación Upway.
 * Etapas: solicitud recibida → caso aprobado (+ link de pago Bold) →
 * pago confirmado → servicio activo (entrega).
 * Solo construyen HTML/texto; el envío lo hace sendEmail() de lib/email.ts.
 */

type ShellData = { title: string; preheader?: string; bodyHtml: string };

function buildShell({ title, preheader, bodyHtml }: ShellData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;padding:24px;">
<tr><td style="padding-bottom:24px;">
  <div style="display:inline-flex;align-items:center;gap:12px;padding:12px 18px;border-radius:14px;background:linear-gradient(135deg,#0d1727 0%,#122841 100%);color:white;">
    <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;">UPW<span style="color:#50e1d5;">▲</span>Y</span>
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;opacity:0.8;">Activación</span>
  </div>
</td></tr>
<tr><td style="padding:28px;background:white;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,39,0.04);">
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">${title}</h1>
  ${preheader ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;">${preheader}</p>` : ''}
  ${bodyHtml}
</td></tr>
<tr><td style="padding-top:16px;text-align:center;font-size:11px;color:#94a3b8;">Upway Business Group S.A.S · upway.business</td></tr>
</table></body></html>`;
}

function rowsHtml(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;white-space:nowrap;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${value}</td></tr>`
    )
    .join('');
}

function infoTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><tbody>${rowsHtml(rows)}</tbody></table>`;
}

function callout(text: string): string {
  return `<div style="margin-top:24px;padding:16px;border-radius:12px;background:#edf5ff;border:1px solid #d3e2ff;">
<p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">💡 Importante</p>
<p style="margin:6px 0 0;font-size:13px;color:#36557c;line-height:1.7;">${text}</p></div>`;
}

function buttonHtml(url: string, label: string): string {
  return `<div style="margin-top:24px;text-align:center;">
<a href="${url}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:#0d1727;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">${label}</a>
<p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br /><span style="color:#64748b;word-break:break-all;">${url}</span></p>
</div>`;
}

// ---------------------------------------------------------------------------
// 1) Solicitud recibida
// ---------------------------------------------------------------------------

export type ActivationReceivedData = {
  caseRef: string;
  contactName: string;
  clinicName: string;
  reviewEmail: string;
  estimatedResponse?: string;
};

export function activationReceivedEmail(d: ActivationReceivedData) {
  const subject = `Recibimos tu solicitud de activación — Ref ${d.caseRef}`;
  const rows: Array<[string, string]> = [
    ['Referencia del caso', d.caseRef],
    ['Organización', d.clinicName],
    ['Contacto', d.contactName],
    ['Canal de verificación', `${d.reviewEmail} (equipo Upway)`],
    ['Tiempo estimado de respuesta', d.estimatedResponse ?? '1–2 días hábiles'],
  ];
  const html = buildShell({
    title: 'Solicitud de activación recibida ✅',
    preheader: 'Nuestro equipo realizará las verificaciones del caso de uso y te responderá a este correo.',
    bodyHtml: `
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Hola ${d.contactName || 'equipo'}, confirmamos la recepción de tu solicitud de activación. Ya está en revisión por el equipo de verificaciones de Upway.</p>
  ${infoTable(rows)}
  ${callout('Te escribiremos a este correo con la confirmación del caso de uso, los detalles del plan y el link de pago seguro de Bold. Si algo no cuadra, te pediremos correcciones antes de continuar.')}`,
  });
  return { subject, html };
}

// ---------------------------------------------------------------------------
// 2) Caso de uso aprobado + link de pago Bold
// ---------------------------------------------------------------------------

export type ActivationApprovedData = {
  caseRef: string;
  contactName: string;
  clinicName: string;
  planName: string;
  monthlyLabel: string;
  ivaLabel: string;
  setupLabel: string;
  totalLabel: string;
  paymentUrl: string;
  reference: string;
};

export function activationApprovedEmail(d: ActivationApprovedData) {
  const subject = `Caso de uso aprobado — confirma tu plan ${d.planName} (Ref ${d.caseRef})`;
  const rows: Array<[string, string]> = [
    ['Referencia del caso', d.caseRef],
    ['Plan aprobado', d.planName],
    ['Mensualidad', d.monthlyLabel],
    ['IVA', d.ivaLabel],
    ['Implementación (setup)', d.setupLabel],
    ['Total a pagar hoy', d.totalLabel],
    ['Referencia de pago', d.reference],
  ];
  const html = buildShell({
    title: '¡Tu caso de uso fue aprobado! 🎉',
    preheader: 'Confirma el pago con el botón seguro de Bold para iniciar la implementación.',
    bodyHtml: `
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Hola ${d.contactName || 'equipo'}, tras la verificación del caso de uso para <strong>${d.clinicName}</strong>, confirmamos que tu solicitud fue <strong style="color:#059669;">APROBADA</strong>. Estos son los detalles del plan:</p>
  ${infoTable(rows)}
  ${buttonHtml(d.paymentUrl, 'Pagar de forma segura con Bold')}
  ${callout('El pago se procesa con <strong>Bold</strong>, nuestra pasarela certificada. Al confirmar el pago iniciamos la implementación de inmediato y te avisaremos en cada etapa hasta la entrega del servicio activo.')}`,
  });
  return { subject, html };
}

// ---------------------------------------------------------------------------
// 3) Pago confirmado
// ---------------------------------------------------------------------------

export type PaymentConfirmedData = {
  contactName: string;
  planName: string;
  amountLabel: string;
  reference: string;
};

export function paymentConfirmedEmail(d: PaymentConfirmedData) {
  const subject = `Pago recibido — comenzamos la implementación (Ref ${d.reference})`;
  const rows: Array<[string, string]> = [
    ['Referencia de pago', d.reference],
    ['Plan', d.planName],
    ['Valor pagado', d.amountLabel],
    ['Estado', 'Pago aprobado — implementación iniciada'],
  ];
  const html = buildShell({
    title: 'Pago confirmado 🚀',
    preheader: 'El equipo Upway ya comenzó la implementación de tu caso de uso.',
    bodyHtml: `
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Hola ${d.contactName || 'equipo'}, recibimos tu pago correctamente. La implementación de <strong>${d.planName}</strong> ya está en curso.</p>
  ${infoTable(rows)}
  ${callout('Próxima parada: la entrega del servicio activo. Te llegará un correo con los datos de acceso actualizados a tu cuenta para monitorear el agente, ajustar el tono y configurar lo que tu plan permita.')}`,
  });
  return { subject, html };
}

// ---------------------------------------------------------------------------
// 4) Entrega del servicio activo
// ---------------------------------------------------------------------------

export type ServiceActiveData = {
  contactName: string;
  clinicName: string;
  planName: string;
  dashboardUrl: string;
  includedMinutes: string;
  includedNumbers: string;
  concurrentCalls: string;
};

export function serviceActiveEmail(d: ServiceActiveData) {
  const subject = `Tu servicio Upway está ACTIVO — entra a tu panel (Ref ${d.clinicName})`;
  const rows: Array<[string, string]> = [
    ['Organización', d.clinicName],
    ['Plan activo', d.planName],
    ['Minutos incluidos / mes', d.includedMinutes],
    ['Números incluidos', d.includedNumbers],
    ['Llamadas simultáneas', d.concurrentCalls],
    ['Estado', 'ACTIVO ✅'],
  ];
  const html = buildShell({
    title: 'Tu agente está en producción 🟢',
    preheader: 'Accede a tu cuenta actualizada para monitorear el agente y ajustar su configuración.',
    bodyHtml: `
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Hola ${d.contactName || 'equipo'}, la implementación terminó: <strong>${d.clinicName}</strong> ya cuenta con el servicio <strong style="color:#059669;">ACTIVO</strong>.</p>
  ${infoTable(rows)}
  ${buttonHtml(d.dashboardUrl, 'Entrar a mi panel Upway')}
  ${callout('Desde tu panel puedes monitorear conversaciones y llamadas en tiempo real, cambiar el tono del agente, activar/desactivar la IA y gestionar el traspaso a humano, según lo permitido por tu plan Telnyx + Upway. El consumo adicional sobre los minutos incluidos se factura según la tarifa de tu plan.')}`,
  });
  return { subject, html };
}

// ---------------------------------------------------------------------------
// 5) Alerta interna para el equipo Upway
// ---------------------------------------------------------------------------

export type InternalAlertData = {
  kind: 'SOLICITUD_RECIBIDA' | 'CASO_APROBADO' | 'PAGO_CONFIRMADO' | 'SERVICIO_ACTIVADO';
  title: string;
  lines: Array<[string, string]>;
};

export function internalActivationAlertEmail(d: InternalAlertData) {
  const subject = `[Upway Interno] ${d.kind} — ${d.title}`;
  const html = buildShell({
    title: d.title,
    preheader: `Evento interno: ${d.kind}`,
    bodyHtml: `
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Evento del flujo de activación que requiere atención del equipo:</p>
  ${infoTable(d.lines)}
  ${callout('Este correo es solo para el equipo interno de Upway. Revisa el panel de activación antes de actuar.')}`,
  });
  return { subject, html };
}