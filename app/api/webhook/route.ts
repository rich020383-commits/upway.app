import { NextResponse, after } from 'next/server';
import { VERIFY_TOKEN, handleStatusUpdate, handleIncomingMessage, MetaWebhookBody } from '@/lib/whatsapp';

// El route es un dispatcher delgado: toda la lógica vive en lib/whatsapp.ts

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse('Acceso denegado', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MetaWebhookBody;

    if (body?.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // 📡 PARTE 1: DOBLE CHECK AZUL (STATUSES)
          if (value?.statuses?.length) {
            await handleStatusUpdate(value);
          }

          // 💬 PARTE 2: MENSAJES ENTRANTES (TEXTO Y AUDIO)
          if (value?.messages?.length) {
            // Registramos la promesa con after() para que el runtime de Next
            // mantenga la invocación viva hasta terminar y capture fallos,
            // mientras respondemos 200 a Meta de inmediato.
            after(() =>
              handleIncomingMessage(value).catch((error) => {
                console.error('❌ [WEBHOOK] Fallo procesando el mensaje entrante:', error);
              })
            );
            return new NextResponse(null, { status: 200 });
          }
        }
      }
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error en el Webhook:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}


