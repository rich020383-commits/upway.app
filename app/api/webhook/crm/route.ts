import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🧠 WEBHOOK MAESTRO MULTI-TENANT (VAPI -> CRM UPWAY)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. FILTRO DE EVENTOS DE VAPI
    // Solo nos interesan los eventos donde el Agente de Voz usó una Herramienta (Tool)
    const messageType = body?.message?.type;
    if (messageType !== 'tool-calls') {
      return new NextResponse(null, { status: 200 });
    }

    const callData = body.message.call;
    const vapiAssistantId = callData?.assistantId;
    const toolCalls = body.message.toolWithToolCallList || [];

    if (!vapiAssistantId || toolCalls.length === 0) {
      return new NextResponse('Faltan datos clave', { status: 400 });
    }

    console.log(`🎙️ [Upway CRM] Recibiendo datos estructurados de Vapi Assistant: ${vapiAssistantId}`);

    // 2. MAGIA MULTI-TENANT: ¿De qué cliente de Upway es esta llamada?
    const tienda = await prisma.tienda.findFirst({
      where: { vapiAssistantId: vapiAssistantId }
    });

    if (!tienda) {
      console.warn(`⚠️ Asistente no vinculado a ningún cliente en Upway: ${vapiAssistantId}`);
      // Le respondemos a Vapi que falló para que el bot le diga al paciente que hubo un error
      return NextResponse.json({
        results: [{
          toolCallId: toolCalls[0]?.toolCall?.id,
          result: "Error: No se encontró la base de datos de la empresa."
        }]
      });
    }

    // 3. EXTRACCIÓN DE DATOS Y GUARDADO EN EL CRM
    // Preparamos un array con las respuestas que Vapi espera
    const toolCallResults = [];

    for (const item of toolCalls) {
      const toolName = item.tool?.function?.name;
      const toolCallId = item.toolCall?.id;
      const args = item.toolCall?.function?.arguments; // Vapi ya nos manda esto como objeto JSON

      if (toolName === 'perfilamiento_y_agenda' || toolName === 'guardar_lead') {
        try {
          const { nombrePaciente, documento, motivoConsulta } = args;

          // 💾 AQUÍ OCURRE LA MAGIA DEL PLUG AND PLAY
          // Guarda el paciente/lead asociado a la Tienda ID exacta.
          // (Nota: Ajusta 'paciente' o 'lead' según cómo se llame tu tabla en Prisma)
          const nuevoLead = await prisma.lead.create({
            data: {
              tiendaId: tienda.id,
              nombre: nombrePaciente || 'Sin Nombre',
              documento: documento || 'No proporcionado',
              motivo: motivoConsulta || 'No especificado',
              origen: 'Llamada Vapi',
              estado: 'Nuevo'
            }
          });

          console.log(`✅ [Upway CRM] Lead guardado exitosamente para ${tienda.nombre}: ${nuevoLead.nombre}`);

          // Le decimos al bot de voz que todo salió perfecto
          toolCallResults.push({
            toolCallId: toolCallId,
            result: `Éxito. Paciente ${nombrePaciente} guardado en el sistema.`
          });

        } catch (dbError) {
          console.error("❌ Error al guardar en Prisma:", dbError);
          toolCallResults.push({
            toolCallId: toolCallId,
            result: "Error interno al guardar en la base de datos."
          });
        }
      }
    }

    // 4. RESPUESTA AL AGENTE DE VOZ
    // Vapi necesita este formato exacto para saber que ya puede seguir hablando
    return NextResponse.json({ results: toolCallResults });

  } catch (error) {
    console.error('❌ Error crítico en Webhook CRM de Vapi:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}