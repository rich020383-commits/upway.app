import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma'; // Asegúrate de que esta ruta apunte a tu instancia de Prisma

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🛡️ AJUSTE 1: Captura robusta para cualquier versión del payload de Vapi
    const toolCalls = body.message?.toolCalls || body.message?.toolWithToolCallList || body.message?.toolCallList || [];

    // 1. Validar que Vapi realmente está pidiendo usar la herramienta
    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({ error: "No se encontraron peticiones de herramientas" }, { status: 400 });
    }

    const toolCall = toolCalls[0];
    const toolCallId = toolCall.id || toolCall.toolCall?.id;
    let args = toolCall.function?.arguments || toolCall.toolCall?.function?.arguments || toolCall.arguments;

    // 🛡️ AJUSTE 2: Si Vapi manda los argumentos como texto, los convertimos a objeto
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (e) {
        args = {};
      }
    }

    const { fecha, nombreCliente, telefono } = args;

    // Vapi envía el ID del asistente en el payload. Lo usamos para saber qué cliente es.
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

    // 3. Validar si el cliente ya conectó su calendario
    if (!tienda.googleRefreshToken) {
      console.warn(`⚠️ La tienda ${tienda.nombre} no tiene Google Calendar configurado.`);
      return NextResponse.json({
        results: [{
          toolCallId: toolCallId,
          result: "El calendario no está sincronizado. Pídele disculpas al cliente, toma sus datos manualmente y dile que un asesor lo llamará para confirmar la cita."
        }]
      });
    }

    // 4. Configurar Google API y crear el evento
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    oauth2Client.setCredentials({ refresh_token: tienda.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Ajuste de tiempos: Asumimos que la cita dura 1 hora
    const startDateTime = new Date(fecha);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); 

    await calendar.events.insert({
      calendarId: tienda.googleCalendarId || 'primary',
      requestBody: {
        summary: `Cita confirmada: ${nombreCliente || 'Paciente'}`,
        description: `Teléfono: ${telefono || 'No proporcionado'}\n\nAgendado automáticamente por el Empleado Digital de Upway.`,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
      },
    });

    console.log(`✅ [Upway Tool] Cita creada para ${tienda.nombre}`);

    // 5. Devolver éxito a la IA para que retome la llamada
    return NextResponse.json({
      results: [{
        toolCallId: toolCallId,
        result: `Cita confirmada exitosamente en el calendario para el ${startDateTime.toLocaleString('es-CO')}. Confírmale al cliente y despídete amablemente.`
      }]
    });

  } catch (error) {
    console.error("❌ [Upway Error] Fallo crítico en agendar_cita:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}