import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
type InputJsonValue = Prisma.InputJsonValue;

export type ProviderEventStatus = 'received' | 'accepted' | 'processed' | 'rejected' | 'failed';

export type ProviderEventInput = {
  provider: string;
  eventType: string;
  status?: ProviderEventStatus;
  clinicId?: string | null;
  tenantId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  performedBy?: string | null;
  payload?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Topes para lo que se guarda en las tablas de auditoría.
 *
 * Las tablas WebhookEventLog y HealthAuditLog crecen de forma indefinida, y la
 * cuota de almacenamiento del plan gratuito es de 0.5 GB por proyecto. Guardar
 * el cuerpo completo de cada webhook (Meta, Telnyx, Bold) hacía que una sola
 * fila pudiera pesar cientos de KB. Estas limites cortan strings largos, listas
 * largas y profundidad excesiva, conservando la estructura para poder auditar.
 */
export const AUDIT_LIMITS = {
  maxDepth: 6,
  maxArrayLength: 50,
  maxStringLength: 2000,
  maxKeys: 100,
  maxTotalChars: 20000,
} as const;

/**
 * Devuelve una copia del valor apta para auditoría: nunca lanza, nunca entra en
 * ciclos y nunca supera el tamaño máximo. Si el resultado serializado excede el
 * tope global, devuelve un resumen recortado en lugar del objeto completo.
 */
export function sanitizeForAudit(value: unknown, limits = AUDIT_LIMITS): unknown {
  const walk = (input: unknown, depth: number): unknown => {
    if (input === null || input === undefined) return null;

    if (typeof input === 'string') {
      return input.length > limits.maxStringLength
        ? input.slice(0, limits.maxStringLength) + `...[+${input.length - limits.maxStringLength}]`
        : input;
    }
    if (typeof input === 'number' || typeof input === 'boolean') return input;
    if (typeof input === 'bigint') return input.toString();
    if (input instanceof Date) return input.toISOString();

    if (Array.isArray(input)) {
      if (depth >= limits.maxDepth) return `[array:${input.length}]`;
      const head = input.slice(0, limits.maxArrayLength).map((item) => walk(item, depth + 1));
      if (input.length > limits.maxArrayLength) {
        head.push(`...[+${input.length - limits.maxArrayLength}]`);
      }
      return head;
    }

    if (typeof input === 'object') {
      if (depth >= limits.maxDepth) return '[objeto]';
      const entries = Object.entries(input as Record<string, unknown>);
      const out: Record<string, unknown> = {};
      for (const [key, val] of entries.slice(0, limits.maxKeys)) {
        out[key] = walk(val, depth + 1);
      }
      if (entries.length > limits.maxKeys) {
        out['...'] = `[+${entries.length - limits.maxKeys} claves]`;
      }
      return out;
    }

    return String(input);
  };

  const result = walk(value, 0);

  try {
    const serialized = JSON.stringify(result ?? null);
    if (serialized.length > limits.maxTotalChars) {
      return {
        truncated: true,
        originalChars: serialized.length,
        preview: serialized.slice(0, limits.maxTotalChars),
      };
    }
    return result;
  } catch {
    // Objeto no serializable (por ejemplo, con referencias circulares).
    return { truncated: true, reason: 'no-serializable' };
  }
}

export async function recordProviderEvent(input: ProviderEventInput) {
  const safePayload = input.payload === undefined ? null : sanitizeForAudit(input.payload);
  const safeMetadata = sanitizeForAudit(input.metadata ?? {});

  return prisma.webhookEventLog.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      status: input.status ?? 'received',
      clinicId: input.clinicId ?? null,
      tenantId: input.tenantId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      performedBy: input.performedBy ?? null,
      payloadJson: safePayload as InputJsonValue,
      metadataJson: safeMetadata as InputJsonValue,
    },
  });
}

export async function appendHealthAuditEntry({
  clinicId,
  entityType,
  entityId,
  action,
  performedBy,
  before,
  after,
}: {
  clinicId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  if (!clinicId) return null;

  return prisma.healthAuditLog.create({
    data: {
      clinicId,
      entityType,
      entityId,
      action,
      performedBy: performedBy ?? null,
      beforeJson: (() => {
        const value = sanitizeForAudit(before ?? null);
        return value === null ? Prisma.JsonNull : (value as InputJsonValue);
      })(),
      afterJson: (() => {
        const value = sanitizeForAudit(after ?? null);
        return value === null ? Prisma.JsonNull : (value as InputJsonValue);
      })(),
    },
  });
}
