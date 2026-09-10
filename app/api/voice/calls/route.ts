import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { createOutboundCall, isTelnyxConfigured } from '@/lib/telnyx/client';

export const maxDuration = 30;

const callSchema = z.object({
  tiendaId: z.string().min(1),
  to: z.string().regex(/^\+\d{7,15}$/, 'El destino debe ser E.164 (+573...)'),
});

// POST /api/voice/calls — llamada de prueba outbound desde el número Telnyx de la tienda.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  const parsed = callSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }
  const tienda = await prisma.tienda.findFirst({
    where: { id: parsed.data.tiendaId, userId: user.id },
  });
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  if (!isTelnyxConfigured()) {
    return NextResponse.json({ error: 'Telnyx no configurado' }, { status: 503 });
  }
  try {
    const res = await createOutboundCall({
      to: parsed.data.to,
      assistantId: tienda.telnyxAssistantId ?? undefined,
      clientState: tienda.id,
    });
    await prisma.llamadaLog.create({
      data: {
        tiendaId: tienda.id,
        callSessionId: (res?.data?.id as string | undefined) ?? `manual-${Date.now()}`,
        direction: 'outbound',
        durationMinutes: 0,
        telnyxCost: 0,
        upwayBilledCost: 0,
        status: 'initiated',
      },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, provider: 'telnyx', call: res?.data ?? res });
  } catch (err) {
    console.error('[telnyx] outbound call failed', err);
    return NextResponse.json({ error: 'Telnyx no pudo iniciar la llamada' }, { status: 502 });
  }
}
