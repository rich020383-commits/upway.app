import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Asegúrate de que apunte a tu cliente de Prisma

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, tiendaId } = body;

    // 1. Validaciones iniciales
    if (!code || !tiendaId) {
      return NextResponse.json({ error: 'Falta el código de autorización o el ID de la tienda' }, { status: 400 });
    }

    const appId = process.env.META_CLIENT_ID;
    const appSecret = process.env.META_CLIENT_SECRET;

    if (!appId || !appSecret) {
      console.error("Faltan variables META_CLIENT_ID o META_CLIENT_SECRET en tu .env");
      return NextResponse.json({ error: 'Configuración interna del servidor incompleta.' }, { status: 500 });
    }

    // 2. Intercambiamos el 'code' por el Access Token definitivo
    const tokenResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error de Meta al obtener el token:', tokenData.error);
      return NextResponse.json({ error: 'Meta rechazó el código de autorización.' }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // 3. 🚀 MAGIA EXTRA: Extraemos los IDs automáticamente consultando a Meta 
    let finalWabaId = null;
    let finalPhoneId = null;
    let finalPhoneNumber = null;

    try {
      // A. Consultamos el debug_token para descubrir qué WABA ID autorizó el cliente
      const appAccessToken = `${appId}|${appSecret}`;
      const debugResponse = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
      const debugData = await debugResponse.json();

      if (debugData.data && debugData.data.granular_scopes) {
        const wabaScope = debugData.data.granular_scopes.find((scope: any) => scope.scope === 'whatsapp_business_management');
        if (wabaScope && wabaScope.target_ids && wabaScope.target_ids.length > 0) {
          finalWabaId = wabaScope.target_ids[0]; // Capturamos el ID corporativo de Meta (WABA)
        }
      }

      // B. Si tenemos el WABA ID, le preguntamos a Meta qué número de teléfono está vinculado
      if (finalWabaId) {
        const phoneResponse = await fetch(`https://graph.facebook.com/v20.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`);
        const phoneData = await phoneResponse.json();

        if (phoneData.data && phoneData.data.length > 0) {
          finalPhoneId = phoneData.data[0].id; // El ID técnico del número
          finalPhoneNumber = phoneData.data[0].display_phone_number; // El "+57 300..." que ve el cliente
        }
      }
    } catch (metaErr) {
      console.error("No se pudieron extraer los IDs automáticos, pero se guardará el token:", metaErr);
    }

    // 4. Guardamos todo en Prisma
    const tiendaActualizada = await prisma.tienda.update({
      where: { id: tiendaId },
      data: {
        metaAccessToken: accessToken,
        metaWabaId: finalWabaId || null,
        metaPhoneNumberId: finalPhoneId || null,
        telefono: finalPhoneNumber || null,
        isWhatsAppActive: false, // 🟠 Se deja en false para que el panel lo muestre como "Pendiente"
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: '¡Datos de WhatsApp guardados exitosamente en la base de datos!', 
      tienda: tiendaActualizada 
    });

  } catch (error) {
    console.error('Error al guardar WhatsApp en Prisma:', error);
    return NextResponse.json({ error: 'Error interno del servidor al guardar.' }, { status: 500 });
  }
}