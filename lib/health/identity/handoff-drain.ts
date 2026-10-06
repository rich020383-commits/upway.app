import { prisma } from '@/lib/prisma';
import { isoDateOnlyFromUtc } from '@/lib/health/identity/persistence';
import {
  HANDOFF_HTTP_TIMEOUT_MS,
  HANDOFF_IDEMPOTENCY_HEADER,
  buildHandoffPayload,
  isDeliverableHandoffUrl,
  planHandoffAttempt,
} from '@/lib/health/identity/handoff';

/**
 * Drenaje de entregas push del registro conforme (núcleo compartido).
 *
 * El mismo corazón lo usan dos disparadores:
 *  - la ruta HTTP `/api/health/identity/handoffs` (cron externo con
 *    `x-upway-cron-secret`, fail-closed), y
 *  - el scheduler interno de `instrumentation.ts` (cada 5 min dentro del
 *    proceso, sin red ni secreto — `lib/health/identity/handoff-scheduler.ts`).
 *
 * Política de reintentos, payload e idempotencia viven en
 * `lib/health/identity/handoff.ts`; aquí solo se consulta, se entrega y se
 * registra el resultado. Lote acotado (`HANDOFF_BATCH_LIMIT`) para que cada
 * corrida sea corta; las corridas siguientes toman lo que quedó pendiente.
 *
 * Asume una sola instancia de servicio (Render: `WEB_CONCURRENCY=1`) — con
 * varias instancias el solape es inofensivo por `idempotencyKey` en el
 * cliente, pero conviene moverlo a un lock externo.
 */
export const HANDOFF_BATCH_LIMIT = 10;

export interface HandoffDrainResult {
  scanned: number;
  delivered: number;
  retried: number;
  failed: number;
}

export async function runHandoffDrain(
  opts: { organizationId?: string | null } = {},
): Promise<HandoffDrainResult> {
  const organizationId = opts.organizationId?.trim() || null;
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
    take: HANDOFF_BATCH_LIMIT,
  });

  const result: HandoffDrainResult = { scanned: rows.length, delivered: 0, retried: 0, failed: 0 };

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

    if (plan.status === 'DELIVERED') result.delivered += 1;
    else if (plan.status === 'PENDING') result.retried += 1;
    else result.failed += 1;
  }

  return result;
}
