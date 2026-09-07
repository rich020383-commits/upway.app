import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { runAutopilot } from '@/lib/autopilot';

/**
 * 🧠 POST /api/business/autopilot
 * Body: { instruction: string, tiendaId?: string }
 * El cerebro LLM analiza la instrucción con el estado real de la operación,
 * genera un plan de acciones y lo ejecuta (asignar, mover etapa, recordatorios,
 * citas, automatización). Tenant-safe: solo toca la tienda del dueño.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, tiendaId } = body ?? {};

    if (typeof instruction !== 'string' || instruction.trim().length < 3) {
      return NextResponse.json({ error: 'Escribe una instrucción para el Autopiloto' }, { status: 400 });
    }

    const { tienda, error } = await getOwnedTienda(request, prisma, typeof tiendaId === 'string' ? tiendaId : null);
    if (error) return error;

    const result = await runAutopilot({ instruction, tiendaId: tienda.id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[autopilot] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'El Autopiloto no pudo completar la instrucción' },
      { status: 500 }
    );
  }
}
