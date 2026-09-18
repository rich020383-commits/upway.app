import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAdmin } from '@/lib/admin-guard';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPass: !!process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    review: process.env.UPWAY_REVIEW_EMAIL,
  };

  console.log('[test-email] Config SMTP:', config);

  if (!config.host || !config.user || !config.hasPass) {
    return NextResponse.json({
      ok: false,
      error: 'SMTP_NO_CONFIGURADO',
      message: 'Faltan variables de entorno SMTP',
      config,
    }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port ?? 587),
      secure: Number(config.port) === 465,
      auth: {
        user: config.user,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('[test-email] Verificando conexión SMTP...');
    await transporter.verify();
    console.log('[test-email] Conexión SMTP exitosa');

    const result = await transporter.sendMail({
      from: config.from,
      to: config.review,
      subject: '[Upway Test] Prueba de configuración SMTP',
      text: `Este es un correo de prueba enviado a las ${new Date().toLocaleString('es-CO')}.\n\nSi recibes esto, la configuración SMTP está correcta.`,
      html: `<h1>✅ Prueba exitosa</h1><p>Si recibes este correo, la configuración SMTP de Upway está funcionando correctamente.</p><p>Enviado: ${new Date().toLocaleString('es-CO')}</p>`,
    });

    console.log('[test-email] Correo enviado:', result.messageId);

    return NextResponse.json({
      ok: true,
      message: 'Correo de prueba enviado exitosamente',
      config: {
        ...config,
        pass: undefined,
      },
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[test-email] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'SMTP_ERROR',
      message: error instanceof Error ? error.message : 'Error desconocido',
      config,
    }, { status: 500 });
  }
}
