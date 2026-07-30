import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { listProducts } from '@/lib/app-state';

const VERIFY_TOKEN = 'upway_webhook_secreto';

async function generarRespuestaConGemini(textoCliente: string, productos: Array<{ nombre: string; precio: number }>) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('No hay API key de Gemini configurada. Define GEMINI_API_KEY o GOOGLE_API_KEY.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🛡️ BLINDAJE DE COSTOS: Solo permitimos el modelo Flash ultra veloz y económico
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🧠 PROMPT SUPREMO ACTUALIZADO CON LA MATRIZ DE CAPACIDAD
    const prompt = `
      Rol: Eres un cerrador de ventas persuasivo y profesional. Trabajas y te identificas como un "Empleado Digital de Upway". El secreto de nuestro servicio es que TODOS los clientes obtienen las funciones principales completas; lo que cambia es su capacidad de procesamiento y volumen.
      
      Objetivo: Asistir a los clientes en WhatsApp, diagnosticar el tamaño de su operación y vender el plan exacto que necesitan.
      
      Reglas:
      - Responde de forma natural, directa, y usando respuestas cortas. Usa emojis estratégicos.
      - Funciones Incluidas siempre: Audios, Imágenes, Documentos, Pedidos, Pagos y Reporte Diario. No limitamos las funciones principales.
      
      Planes (Recomienda solo uno según el tamaño del cliente):
      1. Plan Emprendedor ($149.900 COP/mes): Capacidad para 500 productos, volumen WhatsApp básico.
      2. Plan Negocio ($299.900 COP/mes): Capacidad para 2.000 productos, volumen WhatsApp alto.
      3. Plan Empresa ($499.900 COP/mes): Capacidad para 10.000 productos, volumen WhatsApp muy alto, analítica gerencial.
      4. Plan Personalizado (Desde $999.900 COP/mes): Para corporaciones, sin límites operativos.
      
      Inventario de ejemplo para mostrar capacidad de la IA: ${productos.slice(0, 3).map((p) => `*${p.nombre}* ($${p.precio.toLocaleString('es-CO')})`).join(', ')}.
      
      Cierre: Justifica el precio demostrando que el cliente paga por su capacidad de consumo. Aceptamos pagos seguros vía Nequi, Bancolombia o Wompi.
      
      Mensaje del cliente: "${textoCliente}"
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error('Error en la llamada a Gemini:', error);
    throw error;
  }
}

async function enviarMensajePorWhatsApp(destino: string, mensaje: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID no están configuradas.');
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: destino,
    type: 'text',
    text: { body: mensaje },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API respondió con ${response.status}`);
    }
    console.log('Mensaje enviado por WhatsApp a', destino);
  } catch (error) {
    console.error('Error en el fetch a la API de WhatsApp:', error);
    throw error;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Acceso denegado', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (changes?.messages?.length) {
        const mensajeEntrante = changes.messages[0];
        const numeroCliente = mensajeEntrante.from;
        const textoCliente = mensajeEntrante.text?.body ?? '';

        // 🛡️ BARRERA ANTIBUCLES: Respondemos OK a Meta inmediatamente
        const response = new NextResponse(null, { status: 200 });

        void (async () => {
          try {
            const productos = await listProducts('1172769935927318');
            let respuesta = `Gracias por escribir a Upway. Recibimos tu mensaje.`;

            try {
              respuesta = await generarRespuestaConGemini(textoCliente, productos);
            } catch (geminiError) {
              console.warn('Gemini no pudo responder; usando fallback local.', geminiError);
            }

            await enviarMensajePorWhatsApp(numeroCliente, respuesta);
          } catch (error) {
            console.error('Fallo al procesar y enviar la respuesta del bot.', error);
          }
        })();

        return response;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error en el Webhook:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}