import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🧠 WEBHOOK MAESTRO MULTI-TENANT (VAPI -> CRM UPWAY)
// Maneja tanto herramientas (Tools) como Facturación (Call Logs)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messageType = body?.message?.type;
    const callData = body?.message?.call;

    // ==========================================
    // 💰 MÓDULO DE FACTURACIÓN Y TELEMETRÍA (NUEVO)
    // ==========================================
    if (messageType === 'end-of-call-report') {
      const vapiAssistantId = callData?.assistantId;
      const vapiCallId = callData?.id;
      const status = callData?.status || body?.message?.endedReason || 'completed';
      const direction = callData?.type || 'inbound';
      const vapiCost = callData?.cost || 0;

      // Cálculo de duración exacta en minutos
      const startedAt = callData?.startedAt ? new Date(callData.startedAt).getTime() : 0;
      const endedAt = callData?.endedAt ? new Date(callData.endedAt).getTime() : 0;
      let durationMinutes = 0;
      if (startedAt && endedAt) {
        durationMinutes = (endedAt - startedAt) / 1000 / 60; // milisegundos a minutos
      }

      // 💵 Tu modelo de negocio (Markup). Ejemplo: Cobras el 200% de lo que te cuesta Vapi
      const upwayBilledCost = vapiCost * 2; 

      if (vapiAssistantId && vapiCallId) {
        const tienda = await prisma.tienda.findFirst({
          where: { vapiAssistantId: vapiAssistantId }
        });

        if (tienda) {
          // Guardamos el registro en NeonDB si no existe
          const logExistente = await prisma.llamadaLog.findUnique({ where: { vapiCallId }});
          
          if (!logExistente) {
            await prisma.llamadaLog.create({
              data: {
                tiendaId: tienda.id,
                vapiCallId: vapiCallId,
                direction: direction,
                durationMinutes: parseFloat(durationMinutes.toFixed(2)), // Redondeamos a 2 decimales
                vapiCost: vapiCost,
                upwayBilledCost: upwayBilledCost,
                status: status
              }
            });
            console.log(`✅ [Upway Billing] Llamada facturada a ${tienda.nombre} | Duración: ${durationMinutes.toFixed(1)}m | Cobro: $${upwayBilledCost.toFixed(3)}`);
          }
        }
      }
      return new NextResponse(null, { status: 200 }); // Le decimos a Vapi que recibimos el reporte
    }

    // ==========================================
    // 🛠️ MÓDULO DE HERRAMIENTAS (El que ya tenías)
    // ==========================================
    if (messageType !== 'tool-calls') {
      return new NextResponse(null, { status: 200 });
    }

    const vapiAssistantId = callData?.assistantId;
    const toolCalls = body.message.toolCalls || body.message.toolWithToolCallList || [];

    if (!vapiAssistantId || toolCalls.length === 0) {
      return new NextResponse('Faltan datos clave', { status: 400 });
    }

    const tienda = await prisma.tienda.findFirst({
      where: { vapiAssistantId: vapiAssistantId }
    });

    if (!tienda) {
      return NextResponse.json({
        results: toolCalls.map((item: any) => ({
          toolCallId: item.id || item.toolCall?.id,
          result: "Error: No se encontró la base de datos de la empresa."
        }))
      });
    }

    const toolCallResults = [];

    for (const item of toolCalls) {
      const toolName = item.function?.name || item.tool?.function?.name;
      const toolCallId = item.id || item.toolCall?.id;
      let args = item.function?.arguments || item.toolCall?.function?.arguments;

      if (typeof args === 'string') {
        try { args = JSON.parse(args); } catch (e) { args = {}; }
      }

      console.log(`🛠️ Vapi ejecutando: "${toolName}" para ${tienda.nombre}`);

      // 🔍 HERRAMIENTA 1: CONSULTAR PACIENTE
      if (toolName === 'consultar_paciente') {
        try {
          const { documento } = args || {};
          const paciente = await prisma.lead.findFirst({
            where: { tiendaId: tienda.id, documento: documento }
          });

          if (paciente) {
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Encontrado. Nombre: ${paciente.nombre}. Motivo previo: ${paciente.motivo || paciente.estado}.`
            });
          } else {
            toolCallResults.push({
              toolCallId: toolCallId,
              result: "No encontrado. Pide los datos completos para registrarlo."
            });
          }
        } catch (error) {
          toolCallResults.push({ toolCallId, result: "Error en la consulta." });
        }
      }
      
      // 💾 HERRAMIENTA 2: AGENDAR / GUARDAR LEAD
      else if (toolName === 'perfilamiento_y_agenda' || toolName === 'agendar_cita' || toolName === 'guardar_lead') {
        try {
          const nombrePaciente = args?.nombrePaciente || args?.nombreCliente || 'Sin Nombre';
          const documento = args?.documento;
          const motivoConsulta = args?.motivoConsulta || args?.motivo || 'No especificado';
          
          const leadExistente = await prisma.lead.findFirst({
            where: { tiendaId: tienda.id, documento: documento }
          });

          if (leadExistente) {
            await prisma.lead.update({
              where: { id: leadExistente.id },
              data: { motivo: motivoConsulta, estado: "Cita_Agendada" }
            });
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Éxito. Datos actualizados para ${leadExistente.nombre}.`
            });
          } else {
            await prisma.lead.create({
              data: {
                tiendaId: tienda.id,
                nombre: nombrePaciente,
                documento: documento || 'No proporcionado',
                motivo: motivoConsulta,
                origen: 'Llamada Vapi',
                estado: 'Nuevo' // En el próximo paso Google Calendar lo pasa a Agendado
              }
            });
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Éxito. Paciente ${nombrePaciente} guardado.`
            });
          }
        } catch (error) {
          toolCallResults.push({ toolCallId, result: "Error al guardar paciente." });
        }
      }
    }

    return NextResponse.json({ results: toolCallResults });

  } catch (error) {
    console.error('❌ Error crítico en Webhook CRM:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}