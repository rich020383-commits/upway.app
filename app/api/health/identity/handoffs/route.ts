import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isoDateOnlyFromUtc } from '@/lib/health/identity/persistence';
import { verifySharedSecret } from '@/lib/webhook-verify';
import {
  HANDOFF_HTTP_TIMEOUT_MS,
  HANDOFF_IDEMPOTENCY_HEADER,
  buildHandoffPayload,
  isDeliverableHandoffUrl,
  planHandoffAttempt,
} from '@/lib/health/identity/handoff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Drenaje de las entregas push del registro conforme al HIS/HCE del cliente.
 *
 * POST/GET /api/health/identity/handoffs
 *  - Autenticación: header `x-upway-cron-secret` (o `Authorization: Bearer ...`)
 *    con el valor de CRON_SECRET. Fail-closed: sin la variable configurada el
 *    endpoint responde 503 y sin secreto válido responde 401 — nadie dispara
 *    tráfico saliente hacia sistemas de clientes por accidente.
 *  - Toma las entregas PENDING con `nextAttemptAt` vencido (o null) de llaves
 *    activas con `handoffUrl`, entrega el payload versionado y agenda el
 *    reintento con espera creciente (política pura en
 *    lib/health/identity/handoff.ts).
 *  - `?organizationId=<id>` limita el drenaje a un inquilino (soporte).
 *
 * Invocación: servicio externo (cron de Render o n8n) llamando a esta ruta,
 * con el secreto en el header.
 */

/** Tamaño del lote por corrida: acota la duración total del request. */
const BATCH_LIMIT = 10;

function providedSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-upway-cron-secret');
  if (header) return header;
  const authorization = req.headers.get('authorization');
  return authorization ? authorization.replace(/^Bearer\s+/i, '') : null;
}

async function drain(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) {
    console.error('[handoffs] CRON_SECRET no configurado: drenaje deshabilitado (fail-closed).');
    return NextResponse.json({ error: 'Drenaje no configurado' }, { status: 503 });
  }
  if (!verifySharedSecret(providedSecret(req), secret)) {
    // Diagnóstico de soporte: la longitud del valor esperado permite distinguir
    // si el proceso tiene el secreto vigente o uno heredado de un deploy anterior
    // (solo la longitud — nada reversible ni del secreto). Sin esta señal, un
    // 401 es indistinguible de "el deploy no aplicó las env vars".
    return NextResponse.json(
      { error: 'No autorizado', expectedLength: secret.length },
      { status: 401 }
    );
  }

  const organizationId = req.nextUrl.searchParams.get('organizationId')?.trim() || null;
  const now = new Date();

  const rows = await prisma.identityHandoff.findMany({
    where: {
      status: 'PENDING',
      apiClientId: { not: null },
      ...(organizationId ? { identity: { organizationId } } : {}),
      apiClient: { isActive: true, revokedAt: null, handoffUrl: { not: null } },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    include: {
      identity: true,
      apiClient: { select: { id: true, name: true, handoffUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_LIMIT,
  });

  let delivered = 0;
  let retried = 0;
  let failed = 0;

  for (const row of rows) {
    const url = row.apiClient?.handoffUrl ?? null;
    if (!url || !isDeliverableHandoffUrl(url)) continue; // defensa; el filtro ya lo cubre

    const payload = buildHandoffPayload(
      {
        id: row.identity.id,
        documentType: row.identity.documentType,
        documentNumber: row.identity.documentNumber,
        givenNames: row.identity.givenNames,
        familyNames: row.identity.familyNames,
        birthDate: isoDateOnlyFromUtc(row.identity.birthDate),
        sexCode: row.identity.sexCode,
        municipalityCode: row.identity.municipalityCode,
        departmentCode: row.identity.departmentCode,
        phoneE164: row.identity.phoneE164,
        email: row.identity.email,
        recordHash: row.identity.recordHash,
        completenessPct: row.identity.completenessPct,
        conforming: row.identity.conforming,
        confirmedAt: row.identity.confirmedAt ? row.identity.confirmedAt.toISOString() : null,
        certifiedAt: row.identity.createdAt.toISOString(),
      },
      { idempotencyKey: row.idempotencyKey, attempt: row.attempts + 1 },
    );

    let httpStatus: number | null = null;
    let networkError: string | null = null;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [HANDOFF_IDEMPOTENCY_HEADER]: row.idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(HANDOFF_HTTP_TIMEOUT_MS),
      });
      httpStatus = response.status;
    } catch (error) {
      networkError = error instanceof Error ? error.message : String(error);
    }

    const plan = planHandoffAttempt({ attempts: row.attempts, httpStatus, networkError, now: new Date() });
    await prisma.identityHandoff.update({
      where: { id: row.id },
      data: {
        status: plan.status,
        attempts: plan.attempts,
        lastError: plan.lastError,
        nextAttemptAt: plan.nextAttemptAt,
        deliveredAt: plan.deliveredAt,
      },
    });

    if (plan.status === 'DELIVERED') delivered += 1;
    else if (plan.status === 'PENDING') retried += 1;
    else failed += 1;
  }

  return NextResponse.json({ ok: true, scanned: rows.length, delivered, retried, failed });
}

export async function GET(req: NextRequest) {
  return drain(req);
}

export async function POST(req: NextRequest) {
  return drain(req);
}
