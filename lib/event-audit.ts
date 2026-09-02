import { prisma } from '@/lib/prisma';

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

export async function recordProviderEvent(input: ProviderEventInput) {
  const safePayload = input.payload === undefined ? null : input.payload;
  const safeMetadata = input.metadata ?? {};

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
      payloadJson: safePayload as any,
      metadataJson: safeMetadata as any,
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
      beforeJson: before as any,
      afterJson: after as any,
    },
  });
}
