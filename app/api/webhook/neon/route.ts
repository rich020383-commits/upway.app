import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Capturamos el evento en tiempo real que envía Neon
    const payload = await req.json();
    
    // 2. Extraemos la información (Ej: un nuevo Lead creado por Sophie)
    const { action, table, record } = payload;

    console.log(`⚡ [ALERTA UPWAY] Nueva acción '${action}' en la tabla '${table}'`);
    console.log("📦 Datos del cliente:", record);

    // ==========================================
    // 🧠 AQUÍ VA LA MAGIA AUTOMÁTICA
    // ==========================================
    if (table === 'Lead' && action === 'INSERT') {
      // Ejemplo: Disparar un mensaje de WhatsApp API al dueño de la PYME
      // informando que Sophie acaba de conseguir un nuevo prospecto.
    }

    return NextResponse.json({ success: true, message: "Evento procesado como un reloj" });
  } catch (error) {
    console.error("❌ Error procesando el webhook de Neon:", error);
    return NextResponse.json({ success: false, error: "Fallo en el servidor" }, { status: 500 });
  }
}