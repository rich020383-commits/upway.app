import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🛡️ Captura robusta para cualquier versión del payload de Vapi
    const toolCalls = body.message?.toolCalls || body.message?.toolWithToolCallList || body.message?.toolCallList || [];

    // 1. Validar que Vapi realmente está pidiendo usar la herramienta
    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({ error: "No se encontraron peticiones de herramientas" }, { status: 400 });
    }

    const toolCall = toolCalls[0];
    const toolCallId = toolCall.id || toolCall.toolCall?.id;
    let args = toolCall.function?.arguments || toolCall.toolCall?.function?.arguments || toolCall.arguments;

    // 🛡️ Si Vapi manda los argumentos como texto, los convertimos a objeto
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (e) {
        args = {};
      }
    }

    const { fecha, nombreCliente, telefono } = args;

    // Vapi envía el ID del asistente en el payload. Lo usamos para saber qué tienda es.
    const assistantId = body.message?.assistantId || body.message?.call?.assistantId;
    console.log(`🔥 [Upway Tool] Vapi solicitó agendar para asistente: ${assistantId}`);

    // 2. Buscar la Tienda (Negocio) en Neon usando Prisma
    const tienda = await prisma.tienda.findFirst({
      where: { vapiAssistantId: assistantId }
    });

    if (!tienda) {
      console.warn("❌ Agente no vinculado a ninguna Tienda en Upway.");
      return NextResponse.json({
        results: [{
          toolCallId: toolCallId,
          result: "Error de sistema: Dile al usuario que no puedes agendar en este momento por problemas técnicos."
        }]
      });
    }

    // 3. Procesamiento y registro de la cita de forma limpia
    const startDateTime = new Date(fecha || Date.now());

    console.log(`✅ [Upway Tool] Cita registrada para la tienda ${tienda.nombre} - Cliente: ${nombreCliente || 'Cliente'}, Tel: ${telefono || 'N/A'}, Fecha: ${startDateTime.toLocaleString('es-CO')}`);

    // 4. Devolver éxito a la IA para que retome la llamada con el cliente
    return NextResponse.json({
      results: [{
        toolCallId: toolCallId,
        result: `Cita registrada exitosamente para el ${startDateTime.toLocaleString('es-CO')}. Confírmale al cliente y despídete amablemente.`
      }]
    });

  } catch (error) {
    console.error("❌ [Upway Error] Fallo crítico en agendar_cita:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}