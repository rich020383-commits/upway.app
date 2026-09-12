import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda, getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

type TiendaVoiceFlags = {
  isWhatsAppActive: boolean;
  isAiActive: boolean;
  isVapiActive?: boolean | null;
  isTelnyxActive?: boolean | null;
};

function telnyxActive(tienda: TiendaVoiceFlags): boolean {
  // Telnyx es el canal de voz oficial. vapi solo es alias legacy para datos históricos.
  return tienda.isTelnyxActive ?? tienda.isVapiActive ?? false;
}

function statusLabel(tienda: TiendaVoiceFlags) {
  if (!tienda.isAiActive) return 'paused';
  if (tienda.isWhatsAppActive || telnyxActive(tienda)) return 'active';
  return 'standby';
}

/**
 * Devuelve los agentes reales del negocio autenticado (modelo Tienda), en el
 * mismo shape que consume el panel Health. Hoy cada Tienda representa un solo
 * agente omnicanal (WhatsApp + Telnyx comparten prompt/tono).
 * Unificación Health → Telnyx: el canal de voz expuesto es `telnyx`;
 * `vapi` se mantiene solo como alias legacy para UI antigua.
 */
export async function GET(request: NextRequest) {
  const { context, error: sessionError } = await getHealthSession(request);
  if (sessionError || !context) return sessionError;

  try {
    enforceHealthAccess({
      role: context.role,
      module: 'agents',
      organizationId: context.organizationId,
      clinicId: context.clinicId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }

  const tienda = await prisma.tienda.findFirst({
    where: { userId: context.user.id },
    orderBy: { id: 'asc' },
  });

  const scope = {
    organizationId: context.organizationId,
    clinicId: context.clinicId,
    role: context.role,
  };

  if (!tienda) {
    return NextResponse.json(withTenantScope({ items: [] }, scope));
  }

  const voiceActive = telnyxActive(tienda);
  const agent = {
    id: tienda.id,
    name: tienda.agentName || tienda.nombre,
    prompt: tienda.systemPrompt ?? '',
    channels: {
      whatsapp: tienda.isWhatsAppActive,
      telnyx: voiceActive,
      // Alias legacy para UI antigua: vapi refleja telnyx hasta retirar Vapi.
      vapi: voiceActive,
    },
    isAiActive: tienda.isAiActive,
    status: statusLabel(tienda),
  };

  return NextResponse.json(withTenantScope({ items: [agent] }, scope));
}

/**
 * Actualiza nombre/prompt del agente. Reusa la misma tabla Tienda que ya
 * escribe /api/tienda/config, para que el panel Health y el panel legacy
 * operen sobre el mismo dato. No toca la lógica de aprovisionamiento de voz:
 * la activación real de Telnyx llega vía /api/voice/agents + webhooks.
 */
export async function PATCH(request: NextRequest) {
  const { context, error: sessionError } = await getHealthSession(request);
  if (sessionError || !context) return sessionError;

  try {
    enforceHealthAccess({
      role: context.role,
      module: 'agents',
      organizationId: context.organizationId,
      clinicId: context.clinicId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { agentId, name, prompt } = body ?? {};

  if (!name || typeof name !== 'string' || name.length > 100) {
    return NextResponse.json({ error: 'Nombre de agente inválido' }, { status: 400 });
  }
  if (typeof prompt !== 'string' || prompt.length > 8000) {
    return NextResponse.json({ error: 'Reglas inválidas' }, { status: 400 });
  }

  const { tienda, error } = await getOwnedTienda(request, prisma, agentId);
  if (error) return error;

  const updated = await prisma.tienda.update({
    where: { id: tienda.id },
    data: { agentName: name, systemPrompt: prompt },
  });

  const voiceActive = telnyxActive(updated);

  return NextResponse.json({
    success: true,
    agent: {
      id: updated.id,
      name: updated.agentName || updated.nombre,
      prompt: updated.systemPrompt ?? '',
      channels: {
        whatsapp: updated.isWhatsAppActive,
        telnyx: voiceActive,
        vapi: voiceActive,
      },
      isAiActive: updated.isAiActive,
      status: statusLabel(updated),
    },
  });
}
