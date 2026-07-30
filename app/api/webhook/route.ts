import { NextResponse } from 'next/server';

// 1. VERIFICACIÓN DE META (GET)
// Meta hace un GET aquí cuando configuras el webhook por primera vez
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Token de verificación (debe coincidir con el que pongas en el panel de Meta)
  const VERIFY_TOKEN = "upway_webhook_secreto"; 

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFICADO CON ÉXITO");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Acceso denegado", { status: 403 });
  }
}

// 2. RECEPCIÓN DE MENSAJES (POST)
// Aquí llegan los mensajes cuando un cliente le escribe al WhatsApp del negocio
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      
      if (changes?.messages) {
        const mensajeEntrante = changes.messages[0];
        const numeroCliente = mensajeEntrante.from;
        const textoCliente = mensajeEntrante.text?.body;
        const numeroNegocioId = changes.metadata.phone_number_id; 

        console.log(`Mensaje recibido en la tienda ${numeroNegocioId} de ${numeroCliente}: ${textoCliente}`);

        // Aquí conectaremos la inteligencia y el inventario de Prisma próximamente

        return NextResponse.json({ status: "ok" });
      }
    }
    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("Error en el Webhook:", error);
    return new NextResponse("Error Interno", { status: 500 });
  }
}