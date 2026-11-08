import { NextRequest, NextResponse } from 'next/server';
import { transferirLlamada } from '@/lib/telnyx/client';

export const runtime = 'nodejs';

/**
 * POST /api/voice/transfer
 * Transfiere una llamada de voz activa a un número humano.
 * Body: { call_control_id: string, transfer_to?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_control_id, transfer_to } = body;

    if (!call_control_id) {
      return NextResponse.json(
        { error: 'call_control_id es requerido' },
        { status: 400 }
      );
    }

    const transferTo = transfer_to ?? '+573126427857';
    await transferirLlamada(call_control_id, transferTo);

    return NextResponse.json({ ok: true, transfer_to: transferTo });
  } catch (err) {
    console.error('[voice/transfer]', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}