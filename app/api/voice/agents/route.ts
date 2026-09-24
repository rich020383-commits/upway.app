import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { upsertAssistantForTienda, getTelnyxConfig, isTelnyxConfigured, updateAssistantVoice } from '@/lib/telnyx/client';
import { isValidVoiceValue } from '@/lib/telnyx/voices';

export const maxDuration = 30;

const createAgentSchema = z.object({
  tiendaId: z.string().min(1),
  nombre: z.string().trim().min(2).max(80),
  reglas: z.string().trim().min(10).max(8000),
  nicho: z.string().trim().max(60).optional().default('general'),
  voz: z.string().trim().min(3).max(140).refine(isValidVoiceValue, 'voz inválida').optional(),
  vozLabel: z.string().trim().max(80).optional(),
  telnyxPhoneNumber: z.string().regex(/^\+\d{7,15}$/, 'telnyxPhoneNumber debe ser E.164 (+573...)').optional(),
});

// POST /api/voice/agents — crea/actualiza el AI Assistant Telnyx de la tienda del usuario.
// Reemplaza al antiguo /api/vapi/create (410). Requiere sesión + ownership de tienda.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }

  const parsed = createAgentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }
  const { tiendaId, nombre, reglas, nicho, voz, vozLabel, telnyxPhoneNumber } = parsed.data;

  const tienda = await prisma.tienda.findFirst({ where: { id: tiendaId, userId: user.id } });
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

  // Voz efectiva: la enviada ahora > la elegida en el panel > la histórica.
  const vozFinal =
    voz ??
    (tienda.agentVoice && isValidVoiceValue(tienda.agentVoice)
      ? tienda.agentVoice
      : 'Telnyx.female.sofia');

  if (!isTelnyxConfigured()) {
    return NextResponse.json(
      { error: 'Telnyx no está configurado (TELNYX_API_KEY/APP_ID/DEFAULT_PHONE_NUMBER)' },
      { status: 503 }
    );
  }

  const greeting =
    `Hola, soy ${nombre}, de ${tienda.nombre}. ` +
    `Te ayudo con consultas, agenda y seguimiento. ¿En qué te puedo ayudar hoy?`;

  try {
    const telnyxRes = await upsertAssistantForTienda({
      name: `${nombre} · ${tienda.nombre}`.slice(0, 60),
      greeting,
      instructions: `(Negocio: ${tienda.nombre} | Nicho: ${nicho} | TiendaId: ${tienda.id})\n${reglas}`,
      voice: vozFinal,
    });
    const assistantId: string | undefined =
      telnyxRes?.data?.id ?? telnyxRes?.id ?? getTelnyxConfig().assistantId ?? undefined;

    const updated = await prisma.tienda.update({
      where: { id: tienda.id },
      data: {
        telnyxAssistantId: assistantId ?? tienda.telnyxAssistantId ?? null,
        // Modelo white-glove IPS: número dedicado por tienda (entregado por Upway).
        // Si viene en el request se fija; si no, se conserva el ya asignado.
        ...(telnyxPhoneNumber ? { telnyxPhoneNumber } : {}),
        agentName: nombre,
        systemPrompt: reglas,
        agentVoice: vozFinal,
        agentVoiceLabel: vozLabel ?? tienda.agentVoiceLabel ?? null,
        isTelnyxActive: true,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: 'telnyx',
      assistantId: updated.telnyxAssistantId,
      telnyxPhoneNumber: updated.telnyxPhoneNumber,
      tiendaId: updated.id,
      status: updated.isTelnyxActive ? 'active' : 'inactive',
    });
  } catch (err) {
    // No se expone el detalle crudo de Telnyx al cliente; se guarda log servidor.
    console.error('[telnyx] create agent failed', err);
    await prisma.tienda.update({
      where: { id: tienda.id },
      data: { telnyxAssistantId: tienda.telnyxAssistantId ?? null, agentName: nombre, systemPrompt: reglas, agentVoice: vozFinal, agentVoiceLabel: vozLabel ?? tienda.agentVoiceLabel ?? null, isTelnyxActive: false },
    }).catch(() => undefined);
    return NextResponse.json({ error: 'Telnyx no pudo crear el asistente. Revisa API key / App ID.' }, { status: 502 });
  }
}

const updateVoiceSchema = z.object({
  tiendaId: z.string().min(1),
  voz: z.string().trim().min(3).max(140).refine(isValidVoiceValue, 'voz inválida'),
  vozLabel: z.string().trim().max(80).optional(),
});

// PATCH /api/voice/agents — guarda la voz elegida en el panel de activación
// (/health/production) y, si el assistant ya existe, la aplica en vivo.
// Si Telnyx rechaza el update, la voz queda persistida en Tienda.agentVoice:
// el próximo POST (reprovisionamiento) la usará automáticamente.
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }

  const parsed = updateVoiceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }
  const { tiendaId, voz, vozLabel } = parsed.data;

  const tienda = await prisma.tienda.findFirst({ where: { id: tiendaId, userId: user.id } });
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

  const updated = await prisma.tienda.update({
    where: { id: tienda.id },
    data: { agentVoice: voz, agentVoiceLabel: vozLabel ?? null },
  });

  let appliedToTelnyx = false;
  if (tienda.telnyxAssistantId && isTelnyxConfigured()) {
    try {
      await updateAssistantVoice(tienda.telnyxAssistantId, voz);
      appliedToTelnyx = true;
    } catch (err) {
      // Degradación controlada: el cambio ya está en DB.
      console.warn('[telnyx] no se pudo aplicar la voz en vivo; se usará al reprovisionar', err);
    }
  }

  return NextResponse.json({
    ok: true,
    appliedToTelnyx,
    agentVoice: updated.agentVoice,
    agentVoiceLabel: updated.agentVoiceLabel,
    warning: appliedToTelnyx
      ? null
      : 'Voz guardada. Se aplicará al asistente en el próximo provisionamiento.',
  });
}
