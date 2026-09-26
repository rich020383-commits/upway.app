import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { isTelnyxVoiceReady, listTtsVoices, listVoiceClones, missingTelnyxVoiceEnv, telnyxNotReadyMessage } from '@/lib/telnyx/client';
import {
  FALLBACK_CATALOG,
  mapCatalogVoices,
  mapClonesToOptions,
  type TtsVoice,
  type VoiceCloneRaw,
} from '@/lib/telnyx/voices';
import { checkVoiceRateLimit, voiceRateLimitResponse } from '@/lib/telnyx/rate-limit';

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
  // Dos llamadas a Telnyx por request: limita el abuso del catálogo.
  const rate = checkVoiceRateLimit('catalog', user.id);
  if (!rate.allowed) return voiceRateLimitResponse('catalog', rate);
  if (!isTelnyxVoiceReady()) {
    return NextResponse.json(
      { error: telnyxNotReadyMessage(missingTelnyxVoiceEnv()) },
      { status: 503 }
    );
  }

  const tiendaId = req.nextUrl.searchParams.get('tiendaId');
  let current: { voice: string | null; label: string | null; assistantId: string | null } | null = null;
  // La sede del usuario se resuelve siempre (no solo cuando llega `tiendaId`):
  // hace falta para filtrar los clones aunque el catálogo se pida sin sede.
  const tienda = await prisma.tienda.findFirst({
    where: tiendaId ? { id: tiendaId, userId: user.id } : { userId: user.id },
    select: {
      id: true,
      agentVoice: true,
      agentVoiceLabel: true,
      telnyxAssistantId: true,
    },
  });
  if (tiendaId && !tienda) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  }
  if (tienda) {
    current = {
      voice: tienda.agentVoice ?? null,
      label: tienda.agentVoiceLabel ?? null,
      assistantId: tienda.telnyxAssistantId ?? null,
    };
  }

  // Clones autorizados de ESTA sede. Sin este filtro, `listVoiceClones()`
  // devuelve las voces clonadas de todos los clientes de la cuenta compartida.
  const propias = tienda?.id
    ? await prisma.voiceCloneAuthorization.findMany({
        where: { tiendaId: tienda.id, revokedAt: null, voiceCloneId: { not: null } },
        select: { voiceCloneId: true },
      })
    : [];
  const clonesPropios: string[] = propias.map((r) => r.voiceCloneId as string);

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
      ? // Solo las voces autorizadas por esta sede: la cuenta de Telnyx es
        // compartida y la lista completa exponía los clones de otros clientes.
        (() => {
          const permitidos = new Set(clonesPropios);
          const todos = ((clonesRes.value as { data?: VoiceCloneRaw[] })?.data ?? []) as VoiceCloneRaw[];
          return permitidos.size
            ? mapClonesToOptions(todos.filter((c) => permitidos.has(String(c?.id ?? ''))))
            : [];
        })()
      : [];

  // CONFINIDENCIALIDAD: el proveedor viaja en el campo `provider` de cada
  // opción porque el cliente lo necesita para componer el identificador de
  // voz, pero no se expone en la respuesta.
  const sinProveedor = (options: Array<Record<string, unknown>>) =>
    options.map((opcion) => {
      const copia = { ...opcion };
      delete copia.provider;
      return copia;
    });
  return NextResponse.json({
    ok: true,
    voices: sinProveedor(voices),
    clones: sinProveedor(clones),
    current,
    fallback: usedFallback,
  });
}
