import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { isTelnyxConfigured, listTtsVoices, listVoiceClones } from '@/lib/telnyx/client';
import {
  FALLBACK_CATALOG,
  mapCatalogVoices,
  mapClonesToOptions,
  type TtsVoice,
  type VoiceCloneRaw,
} from '@/lib/telnyx/voices';

export const maxDuration = 30;

// GET /api/voice/voices — catálogo Telnyx + clones de la cuenta + voz actual
// de la tienda (query opcional tiendaId). Sesión obligatoria; el ownership de
// la tienda se verifica antes de devolver cualquier dato propio.
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  if (!isTelnyxConfigured()) {
    return NextResponse.json(
      { error: 'Telnyx no está configurado (falta TELNYX_API_KEY)' },
      { status: 503 }
    );
  }

  const tiendaId = req.nextUrl.searchParams.get('tiendaId');
  let current: { voice: string | null; label: string | null; assistantId: string | null } | null = null;
  if (tiendaId) {
    const tienda = await prisma.tienda.findFirst({ where: { id: tiendaId, userId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    current = {
      voice: tienda.agentVoice ?? null,
      label: tienda.agentVoiceLabel ?? null,
      assistantId: tienda.telnyxAssistantId ?? null,
    };
  }

  const [catalogRes, clonesRes] = await Promise.allSettled([listTtsVoices('telnyx'), listVoiceClones()]);

  if (catalogRes.status === 'rejected') {
    console.warn('[voice] catálogo Telnyx no disponible, usando fallback:', catalogRes.reason);
  }
  let voices =
    catalogRes.status === 'fulfilled'
      ? mapCatalogVoices((catalogRes.value as { voices?: TtsVoice[] })?.voices ?? [])
      : [];
  const usedFallback = voices.length === 0;
  if (usedFallback) voices = FALLBACK_CATALOG;

  const clones =
    clonesRes.status === 'fulfilled'
      ? mapClonesToOptions((clonesRes.value as { data?: VoiceCloneRaw[] })?.data ?? [])
      : [];

  return NextResponse.json({ ok: true, voices, clones, current, fallback: usedFallback });
}
