import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { deleteVoiceClone } from '@/lib/telnyx/client';

export const maxDuration = 30;

const revokeSchema = z.object({
  authorizationId: z.string().trim().min(1),
  motivo: z.string().trim().max(300).optional(),
});

/**
 * GET /api/voice/authorizations — voces clonadas de ESTE cliente, con el estado
 * de su autorización.
 *
 * Se listan desde `VoiceCloneAuthorization` y no desde la API de Telnyx a
 * propósito: la cuenta de Telnyx es de Upway, no del cliente, así que
 * `listVoiceClones()` devuelve las voces de TODOS los tenants. Esta pantalla
 * nunca debe mostrar una voz que otro cliente autorizó.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }

  const tienda = await prisma.tienda.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!tienda) return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 });

  const rows = await prisma.voiceCloneAuthorization.findMany({
    where: { tiendaId: tienda.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    ok: true,
    autorizaciones: rows.map((r) => ({
      id: r.id,
      // El nombre del titular es dato personal de quien autorizó: se muestra
      // porque es SU panel y la revocación es de esa autorización, pero el
      // documento y los hashes de evidencia nunca salen de la base de datos.
      titular: r.consentingName,
      proposito: r.purpose,
      grantedAt: r.grantedAt.toISOString(),
      revokedAt: r.revokedAt?.toISOString() ?? null,
      revokeReason: r.revokeReason ?? null,
      tieneClon: Boolean(r.voiceCloneId),
    })),
  });
}

/**
 * POST /api/voice/authorizations — revoca una voz clonada.
 *
 * Orden deliberado: primero se borra el clon en Telnyx y solo después se marca
 * la autorización. Al revés, un fallo del proveedor dejaría una revocación
 * registrada que no ocurrió, y el cliente creería que su voz está borrada
 * cuando sigue viva en el proveedor.
 *
 * Una autorización ya revocada responde 409 en vez de reintentar contra Telnyx.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }

  const parsed = revokeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }

  const tienda = await prisma.tienda.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!tienda) return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 });

  // El `where` incluye tiendaId: sin eso, un id ajeno bastaría para revocar la
  // voz de otro cliente (o denegar la suya con un 404 engañoso).
  const auth = await prisma.voiceCloneAuthorization.findFirst({
    where: { id: parsed.data.authorizationId, tiendaId: tienda.id },
  });
  if (!auth) return NextResponse.json({ error: 'Autorización no encontrada' }, { status: 404 });
  if (auth.revokedAt) {
    return NextResponse.json({ error: 'Esta voz ya estaba revocada.' }, { status: 409 });
  }

  if (auth.voiceCloneId) {
    try {
      await deleteVoiceClone(auth.voiceCloneId);
    } catch (error) {
      console.error('[voice] no se pudo eliminar el clon en el proveedor', error);
      return NextResponse.json(
        {
          error:
            'No se pudo eliminar la voz en el servicio de Upway. La revocación no se registró para no dejar tu voz activa sin avisarte; intentá de nuevo.',
        },
        { status: 502 }
      );
    }
  }

  const updated = await prisma.voiceCloneAuthorization.update({
    where: { id: auth.id },
    data: {
      revokedAt: new Date(),
      revokeReason: parsed.data.motivo ?? 'Revocada a petición del titular',
    },
  });

  console.info('[voice] autorización de voz revocada', {
    authorizationId: auth.id,
    tiendaId: tienda.id,
    userId: user.id,
  });

  return NextResponse.json({ ok: true, revokedAt: updated.revokedAt?.toISOString() ?? null });
}
