import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

// Cuántos mensajes por conversación devuelve la bandeja. Antes se enviaba el
// historial completo en cada refresco: como la bandeja se consulta de forma
// periódica, eso multiplicaba el tráfico contra la base de datos.
const INBOX_MESSAGES_PER_CONVERSATION = 40;

// 1. OBTENER TODOS LOS CHATS Y MENSAJES (GET)
export async function GET(req: NextRequest) {
  try {
    // 🛡️ El email SIEMPRE viene de la sesión firmada, nunca del query param
    const sessionUser = await getSessionUser(req);
    const email = sessionUser?.email;

    if (!email) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const tienda = await prisma.tienda.findFirst({ where: { userId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    // 📦 Payload acotado: la bandeja se refresca periódicamente, así que devolver
    // el historial completo de cada conversación multiplicaba el peso de cada
    // respuesta y la transferencia de red de la base de datos. Traemos solo los
    // últimos mensajes y únicamente los campos que la UI necesita.
    const conversations = await prisma.conversation.findMany({
      where: { tiendaId: tienda.id },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' }, // Los más recientes primero (para poder cortar)
          take: INBOX_MESSAGES_PER_CONVERSATION,
          select: {
            id: true,
            senderRole: true,
            content: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' } // Los chats con mensajes más recientes arriba
    });

    // La UI espera el historial en orden ascendente (el último elemento es el
    // mensaje más reciente), así que invertimos la página que acabamos de traer.
    const conversationsAsc = conversations.map((conversation) => ({
      ...conversation,
      messages: [...conversation.messages].reverse()
    }));

    return NextResponse.json({
      conversations: conversationsAsc,
      tiendaId: tienda.id,
      metaAccessToken: tienda.metaAccessToken,
      metaPhoneNumberId: tienda.metaPhoneNumberId,
      isAiActive: tienda.isAiActive
    });
  } catch (error) {
    console.error("Error cargando inbox:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// 2. ENVIAR MENSAJE MANUAL COMO HUMANO (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, content } = body;

    // 🛡️ Autenticación: el email viene de la sesión
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.email) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    if (!content || !conversationId) {
      return NextResponse.json({ error: 'Faltan datos para enviar el mensaje' }, { status: 400 });
    }

    // 🛡️ Ownership: la conversación debe pertenecer a una tienda del usuario autenticado
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tienda: { user: { email: sessionUser.email } }
      },
      include: { tienda: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // 🛡️ Credenciales de Meta SIEMPRE desde la BD del dueño, nunca del body
    const { metaAccessToken, metaPhoneNumberId } = conversation.tienda;
    const clientPhone = conversation.clientPhone;

    if (!metaAccessToken || !metaPhoneNumberId) {
      return NextResponse.json({ error: 'La tienda no tiene WhatsApp conectado' }, { status: 400 });
    }

    // A. Enviar el mensaje a Meta (WhatsApp API)
    const url = `https://graph.facebook.com/v20.0/${metaPhoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: clientPhone,
      type: 'text',
      text: { body: content }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${metaAccessToken}` },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const outMessageId = data.messages?.[0]?.id;

    // B. Guardar en la base de datos como "HUMAN"
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        metaMessageId: outMessageId || null,
        senderRole: 'HUMAN',
        content: content,
        status: 'SENT'
      }
    });

    // Actualizamos la fecha del chat para que suba al principio de la lista
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Error enviando mensaje manual:", error);
    return NextResponse.json({ error: 'Fallo al enviar el mensaje' }, { status: 500 });
  }
}