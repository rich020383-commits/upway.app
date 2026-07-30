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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
    const prompt = `Eres el asistente de Upway Business. Responde en español, breve y útil. El cliente dijo: "${textoCliente}". Si menciona inventario, incluye este resumen de productos: ${productos.slice(0, 3).map((p) => `${p.nombre} ($${p.precio.toLocaleString('es-CO')})`).join(', ')}. Si no hay inventario, responde con una confirmación amable.`;

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
    console.error('Faltan variables de entorno para WhatsApp.', {
      hasToken: Boolean(token),
      hasPhoneNumberId: Boolean(phoneNumberId),
    });
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

    const responseBody = await response.text();

    if (!response.ok) {
      console.error('Error al enviar mensaje por WhatsApp.', {
        status: response.status,
        body: responseBody,
        url,
        payload,
      });
      throw new Error(`WhatsApp API respondió con ${response.status}`);
    }

    console.log('Mensaje enviado por WhatsApp correctamente.', {
      destino,
      status: response.status,
      body: responseBody,
    });
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
    console.log('Webhook recibido.', {
      object: body?.object,
      entryCount: body?.entry?.length ?? 0,
    });

    if (body?.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (changes?.messages?.length) {
        const mensajeEntrante = changes.messages[0];
        const numeroCliente = mensajeEntrante.from;
        const textoCliente = mensajeEntrante.text?.body ?? '';

        console.log(`Mensaje recibido de ${numeroCliente}: ${textoCliente}`);

        const response = new NextResponse(null, { status: 200 });

        void (async () => {
          try {
            const productos = await listProducts('1172769935927318');
            let respuesta = textoCliente.toLowerCase().includes('inventario')
              ? `Gracias por preguntar por inventario. Te compartimos un resumen rápido: ${productos.slice(0, 3).map((p) => `${p.nombre} ($${p.precio.toLocaleString('es-CO')})`).join(', ')}.`
              : `Gracias por escribir a Upway. Te confirmamos que recibimos: “${textoCliente || 'tu mensaje'}”. Pronto un agente especializado responderá.`;

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