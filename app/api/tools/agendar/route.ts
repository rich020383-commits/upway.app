import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🛡️ Captura del payload de Vapi
    const toolCalls = body.message?.toolCalls || body.message?.toolWithToolCallList || body.message?.toolCallList || [];

    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({ error: "No se encontraron peticiones de herramientas" }, { status: 400 });
    }

    const toolCall = toolCalls[0];
    const toolCallId = toolCall.id || toolCall.toolCall?.id;
    let args = toolCall.function?.arguments || toolCall.toolCall?.function?.arguments || toolCall.arguments;

    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch (e) { args = {}; }
    }

    const { fecha, nombreCliente, telefono } = args;
    const assistantId = body.message?.assistantId || body.message?.call?.assistantId;

    // 1. Validar a qué Tienda le pertenece esta IA
    const tienda = await prisma.tienda.findFirst({
      where: { vapiAssistantId: assistantId }
    });

    if (!tienda) {
      return NextResponse.json({
        results: [{
          toolCallId: toolCallId,
          result: "Error interno: Dile al cliente que no pudiste acceder a la agenda en este momento."
        }]
      });
    }

    const fechaHoraCita = new Date(fecha || Date.now());

    // 2. 🔥 MAGIA NATIVA: Guardar en tu propia base de datos
    await prisma.cita.create({
      data: {
        tiendaId: tienda.id,
        clienteNombre: nombreCliente || 'Cliente (Voz)',
        clienteTelefono: telefono || 'No proporcionado',
        fechaHora: fechaHoraCita,
        estado: 'CONFIRMADA'
      }
    });

    console.log(`✅ [Agenda Upway] Cita guardada para la tienda ${tienda.nombre} el ${fechaHoraCita.toLocaleString('es-CO')}`);

    // 3. Respuesta exitosa a la IA
    return NextResponse.json({
      results: [{
        toolCallId: toolCallId,
        result: `Cita registrada exitosamente en el sistema para el ${fechaHoraCita.toLocaleString('es-CO')}. Confírmale al cliente de manera amable y despídete.`
      }]
    });

  } catch (error) {
    console.error("❌ Error en Agenda Nativa:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}