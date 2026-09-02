import { NextRequest, NextResponse } from 'next/server';
import { verifySharedSecret } from '@/lib/webhook-verify';
import { recordProviderEvent } from '@/lib/event-audit';

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Verificación de secreto compartido por header X-Webhook-Secret (fail-closed en producción)
    const expectedSecret = process.env.NEON_WEBHOOK_SECRET;

    if (!expectedSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 [NEON WEBHOOK] Falta NEON_WEBHOOK_SECRET: rechazando request (fail-closed).');
        return new NextResponse('Secreto no configurado', { status: 403 });
      }
      console.warn('⚠️ [NEON WEBHOOK] Sin NEON_WEBHOOK_SECRET en desarrollo: request NO verificado.');
    } else if (!verifySharedSecret(req.headers.get('x-webhook-secret'), expectedSecret)) {
      console.warn('🚨 [NEON WEBHOOK] Secreto inválido: request rechazado.');
      return new NextResponse('No autorizado', { status: 401 });
    }

    // 1. Capturamos el evento en tiempo real que envía Neon
    const payload = await req.json();

    // 2. Extraemos la información (Ej: un nuevo Lead creado por Sophie)
    const { action, table, record } = payload;
    const eventType = `${action ?? 'unknown'}_${table ?? 'unknown'}`;

    await recordProviderEvent({
      provider: 'neon',
      eventType,
      status: 'received',
      payload,
      metadata: {
        table: table ?? null,
        action: action ?? null,
      },
    });

    console.log(`⚡ [ALERTA UPWAY] Nueva acción '${action}' en la tabla '${table}'`);
    console.log("📦 Datos del cliente:", record);

    // ==========================================
    // 🧠 AQUÍ VA LA MAGIA AUTOMÁTICA
    // ==========================================
    if (table === 'Lead' && action === 'INSERT') {
      // Ejemplo: Disparar un mensaje de WhatsApp API al dueño de la PYME
      // informando que Sophie acaba de conseguir un nuevo prospecto.
    }

    await recordProviderEvent({
      provider: 'neon',
      eventType,
      status: 'processed',
      payload,
      metadata: {
        table: table ?? null,
        action: action ?? null,
      },
    });

    return NextResponse.json({ success: true, message: "Evento procesado como un reloj" });
  } catch (error) {
    console.error("❌ Error procesando el webhook de Neon:", error);
    return NextResponse.json({ success: false, error: "Fallo en el servidor" }, { status: 500 });
  }
}