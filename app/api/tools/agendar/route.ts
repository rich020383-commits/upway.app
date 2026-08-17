import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma'; // Asegúrate de que esta ruta apunte a tu instancia de Prisma

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const toolCallList = body.message?.toolCallList;

    // 1. Validar que Vapi realmente está pidiendo usar la herramienta
    if (!toolCallList || toolCallList.length === 0) {
      return NextResponse.json({ error: "No se encontraron peticiones de herramientas" }, { status: 400 });
    }

    const toolCall = toolCallList[0];
    const { fecha, nombreCliente, telefono } = toolCall.arguments;

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
          toolCallId: toolCall.id,
          result: "Error de sistema: Dile al usuario que no puedes agendar en este momento por problemas técnicos."
        }]
      });
    }

    // 3. Validar si el cliente ya conectó su calendario
    if (!tienda.googleRefreshToken) {
      console.warn(`⚠️ La tienda ${tienda.nombre} no tiene Google Calendar configurado.`);
      return NextResponse.json({
        results: [{
          toolCallId: toolCall.id,
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
        summary: `Cita confirmada: ${nombreCliente}`,
        description: `Teléfono: ${telefono}\n\nAgendado automáticamente por el Empleado Digital de Upway.`,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
      },
    });

    console.log(`✅ [Upway Tool] Cita creada para ${tienda.nombre}`);

    // 5. Devolver éxito a la IA para que retome la llamada
    return NextResponse.json({
      results: [{
        toolCallId: toolCall.id,
        result: `Cita confirmada exitosamente en el calendario para el ${startDateTime.toLocaleString('es-CO')}. Confírmale al cliente y despídete amablemente.`
      }]
    });

  } catch (error) {
    console.error("❌ [Upway Error] Fallo crítico en agendar_cita:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}