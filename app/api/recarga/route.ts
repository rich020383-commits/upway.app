import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createBoldPaymentLink, type CreateBoldLinkInput } from '@/lib/billing/bold';

/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  POST /api/recarga — Crear link de pago Bold para recarga de mensajes        │
 * │                                                                              │
 * │  Flujo:                                                                      │
 * │    1. Cliente identifica cuántos mensajes le quedan (frontend lo sabe).      │
 * │    2. Elige un paquete y llama a este endpoint.                              │
 * │    3. Devolvemos un payment_url (link de pago Bold) + reference.             │
 * │    4. El usuario paga en pay.bold.co.                                        │
 * │    5. Bold envía webhook a /api/webhooks/bold → se concilia y se acredita.   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

export const runtime = 'nodejs';

const PAQUETES: Record<string, { mensajes: number; precioCOP: number; label: string }> = {
  rapida: { mensajes: 500, precioCOP: 29900, label: 'Recarga Rápida · 500 mensajes' },
  estandar: { mensajes: 1500, precioCOP: 59900, label: 'Recarga Estándar · 1.500 mensajes' },
  pro: { mensajes: 3500, precioCOP: 99900, label: 'Recarga Pro · 3.500 mensajes' },
  ilimitado: { mensajes: -1, precioCOP: 199900, label: 'Mes ilimitado · mensajes infinitos' },
};

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No hay sesión activa.' }, { status: 401 });
    }

    const { paqueteId } = await req.json().catch(() => ({})) as { paqueteId?: string };

    const paquete = paqueteId ? PAQUETES[paqueteId] : null;
    if (!paquete) {
      return NextResponse.json(
        { error: 'Paquete no válido.', paquetes: Object.keys(PAQUETES) },
        { status: 400 }
      );
    }

    // Mensajes ilimitados: no contamos, pero sí facturamos.
    const referencia = `REC-${Date.now()}-${sessionUser.id.slice(-6)}`;
    const descripcion = `${paquete.label} — Upway Chat · ${sessionUser.email}`;

    const input: CreateBoldLinkInput = {
      reference: referencia,
      description: descripcion,
      amountCOP: paquete.precioCOP,
      customerEmail: sessionUser.email,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/webhooks/bold`,
      tags: ['recarga-mensajes', paqueteId!],
    };

    // ── Modo demo: Bold suspendido ──────────────────────────────────────────────
    if (!process.env.BOLD_API_KEY) {
      return NextResponse.json({
        ok: true,
        mode: 'demo',
        message: 'Bold está suspendido en este entorno. La recarga se simula.',
        paquete,
        referencia,
        simulated: true,
      });
    }

    const result = await createBoldPaymentLink(input);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, status: result.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: 'payment',
      payment_url: result.url,
      referencia,
      paquete,
      mensaje: 'Redirigiendo a Bold para autorizar el pago…',
    });
  } catch (error: unknown) {
    console.error('[recarga] error:', error);
    return NextResponse.json(
      { error: 'Sistemas de pago temporalmente no disponibles.' },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({
    paquetes: Object.entries(PAQUETES).map(([id, p]) => ({
      id,
      label: p.label,
      mensajes: p.mensajes,
      precioCOP: p.precioCOP,
    })),
  });
}
