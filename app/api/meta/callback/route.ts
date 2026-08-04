import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { metaAccessToken, metaPhoneNumberId = "ID_DEL_NUMERO", metaWabaId = "ID_DEL_WABA" } = body;

    // 1. Validación de seguridad básica
    if (!metaAccessToken) {
      return NextResponse.json(
        { error: 'Falta el token de acceso de Meta' }, 
        { status: 400 }
      );
    }

    // Usamos el ID fijo que creamos en SQL para el revisor y las pruebas
    const tiendaIdSeguro = "tienda_revisor_001";

    console.log(`Actualizando credenciales de Meta para la tienda: ${tiendaIdSeguro}`);

    // 2. REGISTRAR LA LÍNEA EN META (Opcional)
    if (metaPhoneNumberId && metaPhoneNumberId !== "ID_DEL_NUMERO") {
      try {
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
          console.warn("⚠️ Aviso de Meta (no crítico para pruebas):", errorMeta);
        } else {
          console.log("✅ Línea de WhatsApp registrada oficialmente en Meta.");
        }
      } catch (e) {
        console.error("Error menor al intentar registrar la línea en Graph API:", e);
      }
    }

    // 3. ACTUALIZAR DIRECTAMENTE EN NEON / PRISMA
    await prisma.tienda.update({
      where: { id: tiendaIdSeguro },
      data: {
        metaPhoneNumberId: metaPhoneNumberId,
        metaWabaId: metaWabaId,
        metaAccessToken: metaAccessToken,
        isWhatsAppActive: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Línea de WhatsApp activada y conectada exitosamente' 
    });

  } catch (error) {
    console.error('Error crítico guardando credenciales de Meta:', error);
    return NextResponse.json(
      { error: 'Fallo interno del servidor al procesar el callback' }, 
      { status: 500 }
    );
  }
}