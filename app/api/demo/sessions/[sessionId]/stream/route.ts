import { NextResponse } from 'next/server';
import { subscribe, getSession } from '@/lib/demo/store';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * GET /api/demo/sessions/[sessionId]/stream
 * Server-Sent Events: el navegador se suscribe y recibe el transcript en vivo.
 * Cada cliente ve SOLO su propia sesión (emparejada por sesiónId aleatorio).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  let cerrada = false;

  const unsubscribe = subscribe(sessionId, (sesion) => {
    if (cerrada) return;
    const payload = `data: ${JSON.stringify({
      type: 'session',
      status: sesion.status,
      messages: sesion.messages,
      durationSec: sesion.durationSec,
      conversationId: sesion.conversationId,
    })}\n\n`;
    try {
      writer.write(encoder.encode(payload));
    } catch {
      // El cliente ya se desconectó.
    }
  });

  // Heartbeat cada 25s para mantener la conexión abierta.
  const hb = setInterval(() => {
    if (cerrada) {
      clearInterval(hb);
      return;
    }
    try {
      writer.write(encoder.encode(': heartbeat\n\n'));
    } catch {
      clearInterval(hb);
    }
  }, 25 * 1000);

  // Cuando el cliente cierra el SSE, limpiamos suscripción y heartbeat.
  req.signal.addEventListener('abort', () => {
    cerrada = true;
    clearInterval(hb);
    unsubscribe();
    try {
      writer.close();
    } catch {
      // Ignorar.
    }
  });

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx/proxy: no bufferizar SSE
    },
  });
}