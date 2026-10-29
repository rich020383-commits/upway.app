import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { LEGAL_ENTITY } from '@/lib/legal';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      email,
      company,
      interest,
      notes,
      callId,
      callPhone,
      callDuration,
      segment = 'general',
      estimatedValue,
      source = 'sophie-voice-call',
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: 'name y phone son requeridos' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        company: company || null,
        interest: interest || null,
        notes: notes || null,
        status: 'NEW',
        source,
        sourceCallId: callId || null,
        sourceCallPhone: callPhone || null,
        sourceCallDuration: callDuration ? Number(callDuration) : null,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        segment,
        nextContactAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'CREATED',
        message: `Lead capturado por Sophie (llamada voz) - segmento: ${segment}`,
        metadata: {
          source: 'sophie-voice-call',
          callId,
          callPhone,
          callDuration,
          interest,
          estimatedValue,
        },
      },
    });
    const emailHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><title>Nuevo Lead de Sophie - ${name}</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><tr><td style="background-color: #1b5ed6; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">📞 Nuevo Lead de Sophie</h1><p style="color: #e2e8f0; margin: 8px 0 0; font-size: 14px;">${LEGAL_ENTITY} · ${new Date().toLocaleDateString('es-CO')}</p></td></tr><tr><td style="padding: 24px;"><h2 style="color: #0f172a; margin: 0 0 16px; font-size: 18px;">Datos del Lead</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;"><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Nombre:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${name}</td></tr><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Teléfono:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;"><a href="tel:${phone}" style="color: #1b5ed6; text-decoration: none;">${phone}</a></td></tr>${email ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Email:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;"><a href="mailto:${email}" style="color: #1b5ed6; text-decoration: none;">${email}</a></td></tr>` : ''}${company ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Empresa:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${company}</td></tr>` : ''}<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Segmento:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-transform: capitalize;">${segment}</td></tr><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Interés:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${interest || 'No especificado'}</td></tr><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Estado:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-transform: uppercase; font-size: 12px;">${lead.status}</td></tr>${estimatedValue ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Valor estimado:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">$${estimatedValue.toLocaleString('es-CO')} COP</td></tr>` : ''}${callDuration ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Duración llamada:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${callDuration} segundos</td></tr>` : ''}${callId ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">ID de llamada:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace; font-size: 12px;">${callId}</td></tr>` : ''}${notes ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Notas:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${notes}</td></tr>` : ''}</table></td></tr><tr><td style="padding: 24px; background-color: #edf5ff; text-align: center;"><a href="${process.env.NEXTAUTH_URL ?? 'https://upway.app'}/leads/${lead.id}" style="background-color: #0ba9a9; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Ver Lead en Dashboard</a></td></tr><tr><td style="padding: 16px; background-color: #f1f5f9; text-align: center;"><p style="color: #64748b; font-size: 11px; margin: 0;">${LEGAL_ENTITY} · Bogotá, Colombia · Lead generado por Sophie (IA de voz)</p></td></tr></table></body></html>`;
    const emailText = `NUEVO LEAD DE SOPHIE - ${name}\n========================================\n\nDatos del Lead:\n- Nombre: ${name}\n- Teléfono: ${phone}\n- Email: ${email || 'No proporcionado'}\n- Empresa: ${company || 'No proporcionada'}\n- Segmento: ${segment}\n- Interés: ${interest || 'No especificado'}\n- Estado: ${lead.status}\n${estimatedValue ? `- Valor estimado: $${estimatedValue.toLocaleString('es-CO')} COP` : ''}\n${callDuration ? `- Duración llamada: ${callDuration} segundos` : ''}\n${callId ? `- ID de llamada: ${callId}` : ''}\n${notes ? `- Notas: ${notes}` : ''}\n\nFecha: ${new Date().toLocaleDateString('es-CO')}\nLead ID: ${lead.id}\n\nVer lead: ${process.env.NEXTAUTH_URL ?? 'https://upway.app'}/leads/${lead.id}\n\n${LEGAL_ENTITY} · Bogotá, Colombia`;

    const emailResult = await sendEmail({
      to: process.env.UPWAY_REVIEW_EMAIL || 'activacionplan@upway.business',
      subject: `[Upway] Nuevo Lead de Sophie: ${name} - ${phone}`,
      html: emailHtml,
      text: emailText,
      replyTo: email || undefined,
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
        segment: lead.segment,
      },
      email: emailResult.ok ? 'enviado' : 'falló (SMTP no configurado)',
    });
  } catch (error: unknown) {
    console.error('Error creando lead desde Sophie:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Endpoint de leads de Sophie activo' });
}