import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Asumimos que más adelante extraerás el metaPhoneNumberId desde el Graph API 
    // o que lo mandas desde el front. Por ahora usamos lo que recibimos.
    const { tienda_id, metaAccessToken, metaPhoneNumberId = "ID_DEL_NUMERO", metaWabaId = "ID_DEL_WABA" } = body;

    // 1. Validación de seguridad básica
    if (!tienda_id || !metaAccessToken) {
      return NextResponse.json(
        { error: 'Faltan credenciales de Meta o el ID de la tienda' }, 
        { status: 400 }
      );
    }

    console.log(`Guardando credenciales y registrando línea para: ${tienda_id}`);

    // =================================================================
    // 🚀 EL PASO FANTASMA: REGISTRAR LA LÍNEA EN META PARA RECIBIR MENSAJES
    // =================================================================
    // (Nota: Si el ID del número es válido, esto enciende el Webhook para este cliente)
    if (metaPhoneNumberId && metaPhoneNumberId !== "ID_DEL_NUMERO") {
      try {
        // Debes pedirle al cliente un PIN de 6 dígitos en la UI para este paso (ej. '123456')
        const pin_de_registro = '123456'; 

        const registroMeta = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneNumberId}/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${metaAccessToken}` 
          },
          body: JSON.stringify({ 
            messaging_product: 'whatsapp', 
            pin: pin_de_registro 
          })
        });

        if (!registroMeta.ok) {
          const errorMeta = await registroMeta.json();
          console.warn("⚠️ Aviso: No se pudo registrar la línea en Meta:", errorMeta);
        } else {
          console.log("✅ Línea de WhatsApp registrada oficialmente en Meta.");
        }
      } catch (e) {
        console.error("Error al intentar registrar la línea:", e);
      }
    }

    // =================================================================
    // 2. GUARDAR EN LA BASE DE DATOS (NEON / PRISMA)
    // =================================================================
    await prisma.tienda.update({
      where: { id: tienda_id },
      data: {
        metaPhoneNumberId: metaPhoneNumberId,
        metaWabaId: metaWabaId,
        metaAccessToken: metaAccessToken, // El token para enviar respuestas
        isWhatsAppActive: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Línea de WhatsApp activada, registrada y conectada exitosamente' 
    });

  } catch (error) {
    console.error('Error crítico guardando credenciales de Meta:', error);
    return NextResponse.json(
      { error: 'Fallo interno del servidor al conectar con Neon' }, 
      { status: 500 }
    );
  }
}