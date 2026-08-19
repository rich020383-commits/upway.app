import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🧠 WEBHOOK MAESTRO MULTI-TENANT (VAPI -> CRM UPWAY)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. FILTRO DE EVENTOS DE VAPI
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

    console.log(`🎙️ [Upway CRM] Procesando herramientas para Vapi Assistant: ${vapiAssistantId}`);

    // 2. MAGIA MULTI-TENANT
    const tienda = await prisma.tienda.findFirst({
      where: { vapiAssistantId: vapiAssistantId }
    });

    if (!tienda) {
      return NextResponse.json({
        results: toolCalls.map((item: any) => ({
          toolCallId: item.toolCall?.id,
          result: "Error: No se encontró la base de datos de la empresa."
        }))
      });
    }

    // 3. ENRUTADOR DE HERRAMIENTAS
    const toolCallResults = [];

    for (const item of toolCalls) {
      const toolName = item.tool?.function?.name;
      const toolCallId = item.toolCall?.id;
      const args = item.toolCall?.function?.arguments;

      console.log(`🛠️ DEPURACIÓN: Vapi envió la herramienta llamada: "${toolName}"`);

      // ==========================================
      // 🔍 HERRAMIENTA 1: CONSULTAR PACIENTE
      // ==========================================
      if (toolName === 'consultar_paciente') {
        try {
          const { documento } = args;
          
          const pacienteEncontrado = await prisma.lead.findFirst({
            where: { 
              tiendaId: tienda.id,
              documento: documento 
            }
          });

          if (pacienteEncontrado) {
            console.log(`✅ [Upway CRM] Paciente encontrado: ${pacienteEncontrado.nombre}`);
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Paciente encontrado. Nombre: ${pacienteEncontrado.nombre}. Motivo o estado previo: ${pacienteEncontrado.motivo || pacienteEncontrado.estado}.`
            });
          } else {
            console.log(`⚠️ [Upway CRM] Paciente NO encontrado con cédula: ${documento}`);
            toolCallResults.push({
              toolCallId: toolCallId,
              result: "Paciente no encontrado en la base de datos. Pide amablemente los datos completos para registrarlo como nuevo."
            });
          }
        } catch (error) {
          toolCallResults.push({ toolCallId, result: "Error al consultar la base de datos." });
        }
      }
      
      // ==========================================
      // 💾 HERRAMIENTA 2: AGENDAR / GUARDAR LEAD
      // ==========================================
      else if (toolName === 'perfilamiento_y_agenda' || toolName === 'agendar_cita' || toolName === 'guardar_lead') {
        try {
          const { nombrePaciente, documento, motivoConsulta } = args;
          console.log(`💾 [Upway CRM] Intentando guardar lead para documento: ${documento}`);

          // Buscamos si ya existe para no crear duplicados
          const leadExistente = await prisma.lead.findFirst({
            where: { tiendaId: tienda.id, documento: documento }
          });

          if (leadExistente) {
            await prisma.lead.update({
              where: { id: leadExistente.id },
              data: { motivo: motivoConsulta, estado: "Cita_Agendada" }
            });
            console.log(`✅ [Upway CRM] Lead actualizado: ${leadExistente.nombre}`);
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Éxito. Datos actualizados para el paciente ${leadExistente.nombre}.`
            });
          } else {
            const nuevoLeadCreado = await prisma.lead.create({
              data: {
                tiendaId: tienda.id,
                nombre: nombrePaciente || 'Sin Nombre',
                documento: documento || 'No proporcionado',
                motivo: motivoConsulta || 'No especificado',
                origen: 'Llamada Vapi',
                estado: 'Nuevo'
              }
            });
            console.log(`✅ [Upway CRM] ¡Lead NUEVO guardado en NeonDB!: ${nuevoLeadCreado.nombre}`);
            toolCallResults.push({
              toolCallId: toolCallId,
              result: `Éxito. Paciente nuevo ${nombrePaciente} guardado en el sistema.`
            });
          }
        } catch (dbError) {
          console.error("❌ Error al guardar en Prisma:", dbError);
          toolCallResults.push({ toolCallId, result: "Error interno al guardar en la base de datos." });
        }
      }
    }

    // 4. RESPUESTA A VAPI
    return NextResponse.json({ results: toolCallResults });

  } catch (error) {
    console.error('❌ Error crítico en Webhook CRM:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}