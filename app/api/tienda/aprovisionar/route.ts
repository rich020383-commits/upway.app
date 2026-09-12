import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const {
      nombreNegocio,
      nombreAgente,
      promptMaestro,
      modulosSeleccionados,
      telefonoAdmin
    } = data;

    // 🛡️ El userId SIEMPRE viene de la sesión, nunca del body
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'No hay sesión activa' },
        { status: 401 }
      );
    }

    if (!nombreNegocio || !nombreAgente) {
      return NextResponse.json(
        { error: 'Faltan datos críticos para crear la infraestructura.' },
        { status: 400 }
      );
    }

    const userId = sessionUser.id;
    void sessionUser.email;

    // 🛡️ BARRERA DEFENSIVA: el usuario ya existe porque la sesión es válida
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      // Caso especial: sesión sin registro en BD (ej. revisor Meta). Solo crea si el email de sesión existe.
      console.warn(`⚠️ [Aprovisionamiento] Usuario de sesión "${userId}" sin registro en BD.`);
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos.' },
        { status: 404 }
      );
    }

    // Traducción modular de módulos del carrito a la base de datos
    const hasWhatsApp = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('whatsapp');
    const hasVoice = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('voz');

    // 🔍 Verificamos si ya existe una tienda para este usuario de manera segura
    let nuevaTienda = await prisma.tienda.findFirst({
      where: { userId: userExists!.id }
    });

    if (nuevaTienda) {
      // Si ya existe, actualizamos sus datos de forma independiente
      // Unificación Health → Telnyx: voz oficial = Telnyx. `isVapiActive` solo
      // es alias legacy para UI antigua; la activación real llega vía
      // /api/voice/agents + webhooks (assistant creado + número asignado).
      const voiceActive = hasVoice
        ? (nuevaTienda.isTelnyxActive ?? nuevaTienda.isVapiActive ?? false)
        : false;
      nuevaTienda = await prisma.tienda.update({
        where: { id: nuevaTienda.id },
        data: {
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isTelnyxActive: voiceActive,
          isVapiActive: voiceActive,
          telefonoAdmin: telefonoAdmin || null,
        }
      });
    } else {
      // Si no existe, la creamos desde cero con los módulos exactos elegidos.
      // Voz inicia inactiva hasta crear el AI Assistant Telnyx (pendiente de número).
      nuevaTienda = await prisma.tienda.create({
        data: {
          userId: userExists!.id,
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isTelnyxActive: false,
          isVapiActive: false,
          telefonoAdmin: telefonoAdmin || null,
        }
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: '¡Infraestructura aprovisionada con éxito!',
      tiendaId: nuevaTienda.id
    });

  } catch (error) {
    console.error('❌ Error crítico aprovisionando tienda:', error);
    return NextResponse.json(
      { error: 'Fallo interno al crear la tienda en la base de datos.' },
      { status: 500}
    );
  }
}