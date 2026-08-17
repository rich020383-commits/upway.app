import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Extraemos la lista de llamadas a herramientas que Vapi está ejecutando
    const toolCall = body.message?.toolCallList?.[0];
    
    if (!toolCall) {
      return NextResponse.json({ error: "No tool call found" }, { status: 400 });
    }

    const { id: toolCallId, name, arguments: args } = toolCall;

    let resultadoAccion = "";

    // 2. Evaluamos qué herramienta está invocando la IA
    if (name === "agendar_cita") {
      const { fecha, nombreCliente, telefono } = args;
      
      // 👉 AQUí CONECTAS TU LÓGICA (Google Calendar, GoHighLevel o Base de datos)
      console.log(`Agendando cita para ${nombreCliente} el ${fecha} al teléfono ${telefono}`);
      
      // Simulamos éxito de la integración
      resultadoAccion = `Cita confirmada con éxito para el ${fecha}. Se le ha enviado un recordatorio al cliente.`;
    }

    // 3. Respondemos obligatoriamente con el formato que Vapi espera
    return NextResponse.json({
      results: [
        {
          toolCallId: toolCallId,
          result: resultadoAccion
        }
      ]
    });

  } catch (error) {
    console.error("Error en la herramienta de Vapi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}