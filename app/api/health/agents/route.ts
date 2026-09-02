import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda, getSessionUser } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

function statusLabel(tienda: { isWhatsAppActive: boolean; isVapiActive: boolean; isAiActive: boolean }) {
  if (!tienda.isAiActive) return 'paused';
  if (tienda.isWhatsAppActive || tienda.isVapiActive) return 'active';
  return 'standby';
}

/**
 * Devuelve los agentes reales del negocio autenticado (modelo Tienda), en el
 * mismo shape que consume el panel Health. Hoy cada Tienda representa un solo
 * agente omnicanal (WhatsApp + Vapi comparten prompt/tono).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'clinic-admin';

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  }

  try {
    enforceHealthAccess({ role, module: 'agents', organizationId: 'org-1', clinicId: 'clinic-1' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }

  const tienda = await prisma.tienda.findFirst({
    where: { userId: user.id },
    orderBy: { id: 'asc' },
  });

  if (!tienda) {
    return NextResponse.json(
      withTenantScope({ items: [] }, { organizationId: 'org-1', clinicId: 'clinic-1', role })
    );
  }

  const agent = {
    id: tienda.id,
    name: tienda.agentName || tienda.nombre,
    prompt: tienda.systemPrompt ?? '',
    channels: {
      whatsapp: tienda.isWhatsAppActive,
      vapi: tienda.isVapiActive,
    },
    isAiActive: tienda.isAiActive,
    status: statusLabel(tienda),
  };

  return NextResponse.json(withTenantScope({ items: [agent] }, { organizationId: 'org-1', clinicId: 'clinic-1', role }));
}

/**
 * Actualiza nombre/prompt del agente. Reusa la misma tabla Tienda que ya
 * escribe /api/tienda/config, para que el panel Health y el panel legacy
 * operen sobre el mismo dato.
 */
export async function PATCH(request: NextRequest) {
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

  return NextResponse.json({
    success: true,
    agent: {
      id: updated.id,
      name: updated.agentName || updated.nombre,
      prompt: updated.systemPrompt ?? '',
      channels: { whatsapp: updated.isWhatsAppActive, vapi: updated.isVapiActive },
      isAiActive: updated.isAiActive,
      status: statusLabel(updated),
    },
  });
}
