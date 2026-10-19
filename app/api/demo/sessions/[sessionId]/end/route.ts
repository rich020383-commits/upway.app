/**
 * POST /api/demo/sessions/[sessionId]/end
 * Cierra la sesión del demo desde el cliente (botón "Colgar / Finalizar").
 * El SSE del panel recibe `status: 'ended'` y muestra "Demo completada".
 */
import { NextResponse } from 'next/server';
import { endSession, getSession } from '@/lib/demo/store';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const s = getSession(sessionId);
  if (!s) {
    return NextResponse.json({ error: 'sesion-no-encontrada' }, { status: 404 });
  }
  endSession(sessionId);
  return NextResponse.json({ ok: true, status: 'ended', sessionId });
}