import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/app-state';

const VERIFY_TOKEN = 'upway_webhook_secreto';

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

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (changes?.messages) {
        const mensajeEntrante = changes.messages[0];
        const numeroCliente = mensajeEntrante.from;
        const textoCliente = mensajeEntrante.text?.body ?? '';
        const productos = await listProducts('1172769935927318');

        const respuesta = textoCliente.toLowerCase().includes('inventario')
          ? `Aquí tienes un resumen de productos: ${productos.slice(0, 3).map((p) => `${p.nombre} ($${p.precio.toLocaleString('es-CO')})`).join(', ')}.`
          : `Gracias por escribir a Upway. Te confirmamos que recibimos: “${textoCliente || 'tu mensaje'}”. Pronto un agente especializado responderá.`;

        console.log(`Mensaje recibido de ${numeroCliente}: ${textoCliente}`);

        return NextResponse.json({ status: 'ok', reply: respuesta });
      }
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('Error en el Webhook:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}