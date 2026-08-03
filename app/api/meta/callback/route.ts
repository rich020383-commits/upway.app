import { NextResponse } from 'next/server';
// Asegúrate de importar tu cliente de Prisma correctamente según tu estructura
// import prisma from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tienda_id, metaPhoneNumberId, metaWabaId, metaAccessToken } = body;

    // 1. Validación de seguridad básica
    if (!tienda_id || !metaPhoneNumberId || !metaAccessToken) {
      return NextResponse.json(
        { error: 'Faltan credenciales de Meta o el ID de la tienda' }, 
        { status: 400 }
      );
    }

    console.log(`Guardando credenciales de Meta para la tienda: ${tienda_id}`);

    // 2. Guardar en Neon usando Prisma
    /* 
    // DESCOMENTA ESTO CUANDO TENGAS IMPORTADO PRISMA ARRIBA
    await prisma.tienda.update({
      where: { id: tienda_id },
      data: {
        metaPhoneNumberId: metaPhoneNumberId,
        metaWabaId: metaWabaId,
        metaAccessToken: metaAccessToken,
        isWhatsAppActive: true,
      },
    });
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Línea de WhatsApp activada y conectada exitosamente' 
    });

  } catch (error) {
    console.error('Error crítico guardando credenciales de Meta:', error);
    return NextResponse.json(
      { error: 'Fallo interno del servidor al conectar con Neon' }, 
      { status: 500 }
    );
  }
}