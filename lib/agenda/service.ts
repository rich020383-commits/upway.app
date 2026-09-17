/**
 * Capa de servicio de la Agenda Premium Upway.
 *
 * Traduce el motor puro (`availability.ts`) a operaciones reales sobre Prisma:
 * cupos, holds del agente de voz, citas, lista de espera y auditoría.
 *
 * Reglas de diseño:
 * - La disponibilidad SIEMPRE se recalcula en servidor; jamás se confía en el cliente.
 * - El hold del agente de voz es la fuente autoritativa del cupo al confirmar.
 * - `@@unique([resourceId, slotStart])` es la última línea de defensa anti-solape.
 */

import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  dateKeyInTimeZone,
  resolveAvailabilityRange,
  type AvailabilityExceptionInput,
  type AvailabilityRuleInput,
  type BusyBlock,
} from './availability';
import { formatDateKeyLabel, formatMinutesRange } from './format';

export type AgendaScope = {
  organizationId: string;
  /** Sin clínica = alcance a nivel de organización (recursos compartidos). */
  clinicId?: string;
};

export type AgendaErrorCode =
  | 'SCOPE_REQUIRED'
  | 'INVALID_INPUT'
  | 'SERVICE_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_NOT_ELIGIBLE'
  | 'SLOT_UNAVAILABLE'
  | 'HOLD_NOT_FOUND'
  | 'HOLD_EXPIRED'
  | 'HOLD_ALREADY_USED'
  | 'APPOINTMENT_NOT_FOUND'
  | 'APPOINTMENT_NOT_CHANGEABLE'
  | 'MISSING_PATIENT_DATA'
  | 'WAITLIST_NOT_FOUND';

export type AgendaFailure = { ok: false; code: AgendaErrorCode; message: string };
export type AgendaSuccess<T> = { ok: true } & T;
export type AgendaResult<T> = AgendaSuccess<T> | AgendaFailure;

export type AgendaChannel = 'VOICE' | 'DASHBOARD' | 'EMAIL' | 'API' | 'WALK_IN';
export type AgendaEventType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_CHECKED_IN'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_NO_SHOW'
  | 'REMINDER_SENT'
  | 'HOLD_CREATED'
  | 'HOLD_RELEASED'
  | 'HOLD_EXPIRED'
  | 'WAITLIST_ADDED'
  | 'WAITLIST_OFFERED'
  | 'WAITLIST_CONVERTED';

export const DEFAULT_TIMEZONE = 'America/Bogota';

/** Minutos que el agente de voz puede retener un cupo antes de confirmarlo. */
export function holdTtlMinutes(): number {
  const parsed = Number(process.env.AGENDA_HOLD_TTL_MINUTES ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 60) : 10;
}

/** Anticipación mínima por defecto para agendar. */
export function defaultMinLeadTimeMinutes(): number {
  const parsed = Number(process.env.AGENDA_MIN_LEAD_MINUTES ?? '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
}

function fail(code: AgendaErrorCode, message: string): AgendaFailure {
  return { ok: false, code, message };
}

export function agendaFail(code: AgendaErrorCode, message: string): AgendaFailure {
  return fail(code, message);
}

function requireScope(scope: AgendaScope): AgendaFailure | null {
  if (!scope?.organizationId) {
    return fail('SCOPE_REQUIRED', 'Falta el alcance de la organización para operar la agenda.');
  }
  return null;
}

function organizationFilter(scope: AgendaScope) {
  return {
    organizationId: scope.organizationId,
    ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
  };
}

// Algunas versiones del cliente Prisma exponen este modelo como `service`.
type ServiceOfferingDelegate = typeof prisma.serviceOffering;

const serviceOffering: ServiceOfferingDelegate =
  (prisma as unknown as { serviceOffering?: ServiceOfferingDelegate }).serviceOffering ??
  (prisma as unknown as { service: ServiceOfferingDelegate }).service;

/** Fecha "YYYY-MM-DD" en la zona del negocio (no en UTC del servidor). */
export function todayDateKey(timeZone: string, now: Date = new Date()): string {
  return dateKeyInTimeZone(now, timeZone);
}

export type AuditInput = {
  type: AgendaEventType;
  channel: AgendaChannel;
  appointmentId?: string | null;
  resourceId?: string | null;
  actorUserId?: string | null;
  actorLabel?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Trazabilidad: nunca bloquea la operación si falla el log. */
export async function logAgendaEvent(input: AuditInput): Promise<void> {
  const auditEvent = (prisma as typeof prisma & {
    agendaAuditEvent?: {
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    };
  }).agendaAuditEvent;

  if (!auditEvent) return;

  await auditEvent
    .create({
      data: {
        type: input.type,
        channel: input.channel,
        appointmentId: input.appointmentId ?? null,
        resourceId: input.resourceId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? null,
        message: input.message ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((error: unknown) => {
      console.error('[agenda] no se pudo registrar el evento de auditoría', input.type, error);
    });
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// ---------------------------------------------------------------------------
// Contexto de disponibilidad
// ---------------------------------------------------------------------------

export type AgendaServiceInfo = {
  id: string;
  name: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotStepMinutes: number;
  capacity: number;
  requiresDocuments: boolean;
  prepInstructions: string | null;
  color: string;
};

export type AgendaResourceInfo = {
  id: string;
  name: string;
  timezone: string;
  kind: string;
};

export type AvailabilitySlotView = {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  resourceId: string;
  resourceName: string;
};

export type AvailabilityDayView = {
  dateKey: string;
  dateLabel: string;
  status: 'open' | 'closed';
  slots: AvailabilitySlotView[];
};

export type AvailabilityView = {
  service: AgendaServiceInfo;
  timezone: string;
  days: AvailabilityDayView[];
};

export type ComputeAvailabilityInput = {
  serviceId: string;
  /** Día inicial en "YYYY-MM-DD". Si se omite, se usa hoy en la zona del negocio. */
  dateKey?: string;
  days?: number;
  resourceId?: string | null;
  now?: Date;
};

/** Lista de días consecutivos en "YYYY-MM-DD" a partir de una fecha (máx. 31). */
export function listDateKeys(fromDateKey: string, days: number): string[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromDateKey.trim());
  if (!match) throw new Error(`Fecha inválida (se espera YYYY-MM-DD): ${fromDateKey}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const total = Math.min(Math.max(1, days), 31);
  const keys: string[] = [];

  for (let offset = 0; offset < total; offset += 1) {
    const cursor = new Date(Date.UTC(year, month - 1, day + offset));
    const monthKey = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const dayKey = String(cursor.getUTCDate()).padStart(2, '0');
    keys.push(`${cursor.getUTCFullYear()}-${monthKey}-${dayKey}`);
  }

  return keys;
}

export async function resolveAgendaTimezone(
  scope: AgendaScope,
  resourceTimezone?: string | null
): Promise<string> {
  if (resourceTimezone) return resourceTimezone;
  if (scope.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: scope.clinicId },
      select: { timezone: true },
    });
    if (clinic?.timezone) return clinic.timezone;
  }
  return DEFAULT_TIMEZONE;
}

async function loadServiceInfo(
  scope: AgendaScope,
  serviceId: string
): Promise<AgendaResult<{ service: AgendaServiceInfo }>> {
  const service = await serviceOffering.findFirst({
    where: { id: serviceId, ...organizationFilter(scope) },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
      slotStepMinutes: true,
      capacity: true,
      requiresDocuments: true,
      prepInstructions: true,
      color: true,
    },
  });

  if (!service) {
    return fail('SERVICE_NOT_FOUND', 'El servicio solicitado no existe en esta organización.');
  }

  return { ok: true, service };
}

async function loadEligibleResources(
  scope: AgendaScope,
  serviceId: string,
  resourceId?: string | null
): Promise<AgendaResult<{ resources: AgendaResourceInfo[] }>> {
  const links = await prisma.resourceService.findMany({
    where: {
      serviceId,
      isActive: true,
      resource: {
        isActive: true,
        organizationId: scope.organizationId,
        // Recursos de la clínica + recursos compartidos de la organización.
        ...(scope.clinicId ? { OR: [{ clinicId: scope.clinicId }, { clinicId: null }] } : {}),
      },
    },
    select: { resource: { select: { id: true, name: true, timezone: true, kind: true } } },
  });

  const resources = links.map((link) => link.resource);

  if (resourceId) {
    const requested = resources.find((resource) => resource.id === resourceId);
    if (!requested) {
      return fail(
        'RESOURCE_NOT_ELIGIBLE',
        'El recurso indicado no está habilitado para este servicio.'
      );
    }
    return { ok: true, resources: [requested] };
  }

  if (resources.length === 0) {
    return fail('RESOURCE_NOT_FOUND', 'No hay recursos activos para este servicio.');
  }

  return { ok: true, resources };
}

export { loadServiceInfo, loadEligibleResources };

type BusyContext = {
  busy: BusyBlock[];
  holds: BusyBlock[];
};

/** Ventana UTC generosa que cubre cualquier zona horaria de América. */
function utcQueryWindow(dateKeys: string[]): { from: Date; to: Date } {
  const first = dateKeys[0];
  const last = dateKeys[dateKeys.length - 1];
  const toUtc = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const DAY = 24 * 60 * 60 * 1000;
  return {
    from: new Date(toUtc(first) - 14 * 60 * 60 * 1000),
    to: new Date(toUtc(last) + DAY + 14 * 60 * 60 * 1000),
  };
}

/** Citas vigentes + holds activos, en un solo par de consultas. */
async function loadBusyBlocks(
  resourceIds: string[],
  dateKeys: string[],
  now: Date
): Promise<BusyContext> {
  const { from, to } = utcQueryWindow(dateKeys);

  const [appointments, holds] = await Promise.all([
    prisma.agendaAppointment.findMany({
      where: {
        resourceId: { in: resourceIds },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'REBOOKED'] },
        slotStart: { gte: from, lt: to },
      },
      select: { slotStart: true, slotEnd: true },
    }),
    prisma.appointmentHold.findMany({
      where: {
        resourceId: { in: resourceIds },
        consumedAt: null,
        releasedAt: null,
        expiresAt: { gt: now },
        slotStart: { gte: from, lt: to },
      },
      select: { slotStart: true, slotEnd: true },
    }),
  ]);

  return {
    busy: appointments.map((appointment) => ({
      start: appointment.slotStart,
      end: appointment.slotEnd,
    })),
    holds: holds.map((hold) => ({ start: hold.slotStart, end: hold.slotEnd })),
  };
}

async function loadRulesAndExceptions(
  resourceIds: string[],
  dateKeys: string[]
): Promise<{ rules: AvailabilityRuleInput[]; exceptions: AvailabilityExceptionInput[] }> {
  const { from, to } = utcQueryWindow(dateKeys);

  const [rules, exceptions] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { resourceId: { in: resourceIds }, isActive: true },
      select: {
        resourceId: true,
        serviceId: true,
        dayOfWeek: true,
        startMinute: true,
        endMinute: true,
        slotStepMinutes: true,
        validFrom: true,
        validTo: true,
        isActive: true,
      },
    }),
    prisma.availabilityException.findMany({
      where: { resourceId: { in: resourceIds }, date: { gte: from, lte: to } },
      select: {
        resourceId: true,
        date: true,
        kind: true,
        allDay: true,
        startMinute: true,
        endMinute: true,
      },
    }),
  ]);

  return {
    rules: rules as AvailabilityRuleInput[],
    exceptions: exceptions as AvailabilityExceptionInput[],
  };
}

// ---------------------------------------------------------------------------
// Disponibilidad
// ---------------------------------------------------------------------------

/**
 * Cupos reales del servicio para uno o varios días.
 * Combina todos los recursos elegibles: si hay 3 profesionales, un mismo
 * horario aparece atribuido a cada uno de los que puede atenderlo.
 */
export async function computeAvailability(
  scope: AgendaScope,
  input: ComputeAvailabilityInput
): Promise<AgendaResult<AvailabilityView>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  if (!input?.serviceId) {
    return fail('INVALID_INPUT', 'Falta el servicio para calcular la disponibilidad.');
  }

  const serviceResult = await loadServiceInfo(scope, input.serviceId);
  if (!serviceResult.ok) return serviceResult;

  const resourcesResult = await loadEligibleResources(scope, input.serviceId, input.resourceId);
  if (!resourcesResult.ok) return resourcesResult;

  const now = input.now ?? new Date();
  const timezone = await resolveAgendaTimezone(scope, resourcesResult.resources[0]?.timezone);
  const fromDateKey = input.dateKey ?? todayDateKey(timezone, now);
  const dateKeys = listDateKeys(fromDateKey, input.days ?? 1);

  const resourceIds = resourcesResult.resources.map((resource) => resource.id);
  const [busyContext, ruleContext] = await Promise.all([
    loadBusyBlocks(resourceIds, dateKeys, now),
    loadRulesAndExceptions(resourceIds, dateKeys),
  ]);

  const { service } = serviceResult;
  // Las reglas específicas del servicio conviven con las genéricas del recurso.
  const serviceRules = ruleContext.rules.filter(
    (rule) => rule.serviceId === service.id || rule.serviceId == null
  );

  const perDay = new Map<string, AvailabilitySlotView[]>();
  const openDays = new Set<string>();
  for (const dateKey of dateKeys) perDay.set(dateKey, []);

  for (const resource of resourcesResult.resources) {
    const resolved = resolveAvailabilityRange({
      fromDateKey,
      days: dateKeys.length,
      timeZone: resource.timezone || timezone,
      rules: serviceRules,
      exceptions: ruleContext.exceptions,
      appointments: busyContext.busy,
      holds: busyContext.holds,
      durationMinutes: service.durationMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      slotStepMinutes: service.slotStepMinutes,
      minLeadTimeMinutes: defaultMinLeadTimeMinutes(),
      now,
      resourceId: resource.id,
    });

    for (const day of resolved) {
      if (day.status === 'open') openDays.add(day.dateKey);
      const bucket = perDay.get(day.dateKey);
      if (!bucket) continue;
      for (const slot of day.slots) {
        bucket.push({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          startLabel: slot.startLabel,
          endLabel: slot.endLabel,
          resourceId: resource.id,
          resourceName: resource.name,
        });
      }
    }
  }

  const days: AvailabilityDayView[] = dateKeys.map((dateKey) => {
    const slots = (perDay.get(dateKey) ?? []).sort((a, b) => a.start.localeCompare(b.start));
    return {
      dateKey,
      dateLabel: formatDateKeyLabel(dateKey),
      status: openDays.has(dateKey) ? 'open' : 'closed',
      slots,
    };
  });

  return { ok: true, service, timezone, days };
}

/** Disponibilidad de un solo día, en formato plano (lo que necesita el agente). */
export async function resolveDayAvailability(
  scope: AgendaScope,
  input: { serviceId: string; dateKey: string; resourceId?: string | null; now?: Date }
): Promise<
  AgendaResult<{
    service: AgendaServiceInfo;
    timezone: string;
    dateKey: string;
    dateLabel: string;
    slots: AvailabilitySlotView[];
  }>
> {
  const result = await computeAvailability(scope, {
    serviceId: input.serviceId,
    dateKey: input.dateKey,
    days: 1,
    resourceId: input.resourceId,
    now: input.now,
  });

  if (!result.ok) return result;

  const day = result.days[0];
  return {
    ok: true,
    service: result.service,
    timezone: result.timezone,
    dateKey: day?.dateKey ?? input.dateKey,
    dateLabel: day?.dateLabel ?? formatDateKeyLabel(input.dateKey),
    slots: day?.slots ?? [],
  };
}

/** Busca el siguiente día con cupos (para "¿le busco el más cercano?"). */
export async function findNextAvailableDay(
  scope: AgendaScope,
  input: { serviceId: string; fromDateKey: string; searchDays?: number; resourceId?: string | null; now?: Date }
): Promise<AgendaResult<{ found: boolean; dateKey: string; dateLabel: string; slots: AvailabilitySlotView[] }>> {
  const result = await computeAvailability(scope, {
    serviceId: input.serviceId,
    dateKey: input.fromDateKey,
    days: input.searchDays ?? 14,
    resourceId: input.resourceId,
    now: input.now,
  });

  if (!result.ok) return result;

  const day = result.days.find((candidate) => candidate.slots.length > 0);
  if (!day) {
    return {
      ok: true,
      found: false,
      dateKey: input.fromDateKey,
      dateLabel: formatDateKeyLabel(input.fromDateKey),
      slots: [],
    };
  }

  return {
    ok: true,
    found: true,
    dateKey: day.dateKey,
    dateLabel: day.dateLabel,
    slots: day.slots,
  };
}

// ---------------------------------------------------------------------------
// Holds: el agente de voz aparta el cupo mientras confirma los datos
// ---------------------------------------------------------------------------

export type HoldSlotInput = {
  serviceId: string;
  /** ISO del inicio del cupo. Debe coincidir con un cupo realmente disponible. */
  slotStart: string;
  resourceId?: string | null;
  channel?: AgendaChannel;
  callId?: string | null;
  createdByUserId?: string | null;
};

export type HoldSlotView = {
  holdToken: string;
  expiresAt: string;
  slotStart: string;
  slotEnd: string;
  resourceId: string;
  resourceName: string;
  serviceId: string;
  serviceName: string;
  timezone: string;
  holdMinutes: number;
};

/** Resuelve una fecha concreta de cupo a la zona del negocio y busca el recurso. */
async function locateSlot(
  scope: AgendaScope,
  input: { serviceId: string; slotStart: string; resourceId?: string | null; now?: Date }
): Promise<
  AgendaResult<{
    service: AgendaServiceInfo;
    timezone: string;
    dateKey: string;
    dateLabel: string;
    resourceId: string;
    resourceName: string;
    start: Date;
    end: Date;
  }>
> {
  const start = new Date(input.slotStart);
  if (Number.isNaN(start.getTime())) {
    return fail('INVALID_INPUT', 'La fecha y hora del cupo no es válida.');
  }

  const serviceResult = await loadServiceInfo(scope, input.serviceId);
  if (!serviceResult.ok) return serviceResult;

  const resourcesResult = await loadEligibleResources(scope, input.serviceId, input.resourceId);
  if (!resourcesResult.ok) return resourcesResult;

  const timezone = await resolveAgendaTimezone(scope, resourcesResult.resources[0]?.timezone);
  const dateKey = dateKeyInTimeZone(start, timezone);

  const dayResult = await resolveDayAvailability(scope, {
    serviceId: input.serviceId,
    dateKey,
    resourceId: input.resourceId,
    now: input.now,
  });
  if (!dayResult.ok) return dayResult;

  const match = dayResult.slots.find(
    (slot) => new Date(slot.start).getTime() === start.getTime()
  );
  if (!match) {
    return fail('SLOT_UNAVAILABLE', 'Ese horario ya no está disponible. Ofrezca otro cupo.');
  }

  return {
    ok: true,
    service: serviceResult.service,
    timezone,
    dateKey,
    dateLabel: dayResult.dateLabel,
    resourceId: match.resourceId,
    resourceName: match.resourceName,
    start: new Date(match.start),
    end: new Date(match.end),
  };
}

export async function holdSlot(
  scope: AgendaScope,
  input: HoldSlotInput
): Promise<AgendaResult<HoldSlotView>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const located = await locateSlot(scope, {
    serviceId: input.serviceId,
    slotStart: input.slotStart,
    resourceId: input.resourceId,
  });
  if (!located.ok) return located;

  const minutes = holdTtlMinutes();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  const hold = await prisma.appointmentHold.create({
    data: {
      holdToken: crypto.randomUUID(),
      resourceId: located.resourceId,
      serviceId: located.service.id,
      slotStart: located.start,
      slotEnd: located.end,
      channel: input.channel ?? 'VOICE',
      callId: input.callId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      expiresAt,
    },
    select: { holdToken: true, expiresAt: true },
  });

  await logAgendaEvent({
    type: 'HOLD_CREATED',
    channel: input.channel ?? 'VOICE',
    resourceId: located.resourceId,
    actorUserId: input.createdByUserId ?? null,
    message: `Cupo apartado ${located.service.name} · ${located.start.toISOString()}`,
    metadata: { holdToken: hold.holdToken, expiresAt: hold.expiresAt.toISOString(), callId: input.callId ?? null },
  });

  return {
    ok: true,
    holdToken: hold.holdToken,
    expiresAt: hold.expiresAt.toISOString(),
    slotStart: located.start.toISOString(),
    slotEnd: located.end.toISOString(),
    resourceId: located.resourceId,
    resourceName: located.resourceName,
    serviceId: located.service.id,
    serviceName: located.service.name,
    timezone: located.timezone,
    holdMinutes: minutes,
  };
}

export async function releaseHold(
  scope: AgendaScope,
  holdToken: string
): Promise<AgendaResult<{ released: boolean }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const hold = await prisma.appointmentHold.findUnique({ where: { holdToken } });
  if (!hold) return fail('HOLD_NOT_FOUND', 'No se encontró el cupo apartado.');
  if (hold.consumedAt) return fail('HOLD_ALREADY_USED', 'Ese cupo apartado ya fue convertido en cita.');

  await prisma.appointmentHold.update({
    where: { holdToken },
    data: { releasedAt: new Date() },
  });

  await logAgendaEvent({
    type: 'HOLD_RELEASED',
    channel: hold.channel,
    resourceId: hold.resourceId,
    message: 'Cupo liberado manualmente',
    metadata: { holdToken },
  });

  return { ok: true, released: true };
}

/** Marca como liberados los holds vencidos. Idempotente: se puede correr seguido. */
export async function expireStaleHolds(now: Date = new Date()): Promise<{ expired: number }> {
  const stale = await prisma.appointmentHold.findMany({
    where: { consumedAt: null, releasedAt: null, expiresAt: { lt: now } },
    select: { id: true, holdToken: true, resourceId: true, channel: true },
    take: 500,
  });

  if (stale.length === 0) return { expired: 0 };

  await prisma.appointmentHold.updateMany({
    where: { id: { in: stale.map((hold) => hold.id) } },
    data: { releasedAt: now },
  });

  await logAgendaEvent({
    type: 'HOLD_EXPIRED',
    channel: 'API',
    message: `${stale.length} cupo(s) apartado(s) vencido(s)`,
    metadata: { holdTokens: stale.map((hold) => hold.holdToken) },
  });

  return { expired: stale.length };
}

// ---------------------------------------------------------------------------
// Citas
// ---------------------------------------------------------------------------

export type BookAppointmentInput = {
  serviceId: string;
  slotStart: string;
  patientName: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  patientDocument?: string | null;
  notes?: string | null;
  resourceId?: string | null;
  /** Si viene de un hold del agente, el hold decide recurso y horario. */
  holdToken?: string | null;
  channel?: AgendaChannel;
  leadId?: string | null;
  conversationId?: string | null;
  createdByUserId?: string | null;
  assignedToUserId?: string | null;
  callId?: string | null;
  status?: 'PENDING' | 'CONFIRMED';
};

export type AppointmentView = {
  id: string;
  calendarUid: string;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  patientDocument: string | null;
  slotStart: string;
  slotEnd: string;
  status: string;
  source: string;
  timezone: string;
  notes: string | null;
  requiresDocuments: boolean;
  prepInstructions: string | null;
};

type AppointmentRecord = {
  id: string;
  calendarUid: string | null;
  serviceId: string;
  resourceId: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  patientDocument: string | null;
  slotStart: Date;
  slotEnd: Date;
  status: string;
  source: string;
  notes: string | null;
  service?: { name: string; requiresDocuments: boolean; prepInstructions: string | null } | null;
  resource?: { name: string; timezone: string } | null;
};

export function toAppointmentView(record: AppointmentRecord, fallbackTimezone: string): AppointmentView {
  return {
    id: record.id,
    calendarUid: record.calendarUid ?? record.id,
    serviceId: record.serviceId,
    serviceName: record.service?.name ?? 'Servicio',
    resourceId: record.resourceId,
    resourceName: record.resource?.name ?? 'Recurso',
    patientName: record.patientName,
    patientPhone: record.patientPhone,
    patientEmail: record.patientEmail,
    patientDocument: record.patientDocument,
    slotStart: record.slotStart.toISOString(),
    slotEnd: record.slotEnd.toISOString(),
    status: record.status,
    source: record.source,
    timezone: record.resource?.timezone || fallbackTimezone,
    notes: record.notes,
    requiresDocuments: record.service?.requiresDocuments ?? false,
    prepInstructions: record.service?.prepInstructions ?? null,
  };
}

const appointmentInclude = {
  service: { select: { name: true, requiresDocuments: true, prepInstructions: true } },
  resource: { select: { name: true, timezone: true } },
} as const;

export { appointmentInclude, toAppointmentView as toView };

export async function bookAppointment(
  scope: AgendaScope,
  input: BookAppointmentInput
): Promise<AgendaResult<{ appointment: AppointmentView }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const patientName = (input.patientName ?? '').trim();
  if (patientName.length < 2) {
    return fail('MISSING_PATIENT_DATA', 'Falta el nombre completo del paciente.');
  }

  const patientPhone = (input.patientPhone ?? '').trim() || null;
  const patientEmail = (input.patientEmail ?? '').trim() || null;
  if (!patientPhone && !patientEmail) {
    return fail(
      'MISSING_PATIENT_DATA',
      'Se necesita al menos un teléfono o un correo para confirmar la cita.'
    );
  }

  let resourceId: string | null = input.resourceId ?? null;
  let serviceId = input.serviceId;
  let start: Date;
  let end: Date;
  let timezone = '';
  let holdToken: string | null = null;

  if (input.holdToken) {
    const hold = await prisma.appointmentHold.findUnique({ where: { holdToken: input.holdToken } });
    if (!hold) return fail('HOLD_NOT_FOUND', 'No se encontró el cupo apartado.');
    if (hold.consumedAt) return fail('HOLD_ALREADY_USED', 'Ese cupo apartado ya fue usado.');
    if (hold.releasedAt) return fail('HOLD_EXPIRED', 'El cupo apartado ya se liberó.');
    if (hold.expiresAt.getTime() < Date.now()) {
      return fail('HOLD_EXPIRED', 'El cupo apartado venció. Busque otro horario.');
    }

    // El hold es la fuente autoritativa: manda su recurso, servicio y horario.
    resourceId = hold.resourceId;
    serviceId = hold.serviceId;
    start = hold.slotStart;
    end = hold.slotEnd;
    holdToken = hold.holdToken;
  } else {
    const located = await locateSlot(scope, {
      serviceId: input.serviceId,
      slotStart: input.slotStart,
      resourceId: input.resourceId,
    });
    if (!located.ok) return located;
    resourceId = located.resourceId;
    start = located.start;
    end = located.end;
    timezone = located.timezone;
  }

  const service = await serviceOffering.findFirst({
    where: { id: serviceId, ...organizationFilter(scope) },
    select: { id: true, name: true, requiresDocuments: true },
  });
  if (!service) return fail('SERVICE_NOT_FOUND', 'El servicio ya no existe.');

  if (!timezone) {
    const resource = await prisma.scheduleResource.findUnique({
      where: { id: resourceId },
      select: { timezone: true },
    });
    timezone = await resolveAgendaTimezone(scope, resource?.timezone);
  }

  const eligible = await prisma.resourceService.findFirst({
    where: { serviceId, resourceId, isActive: true },
    select: { id: true },
  });
  if (!eligible) {
    return fail('RESOURCE_NOT_ELIGIBLE', 'Ese profesional no atiende este servicio.');
  }

  // Si el servicio exige documentos, la cita nace PENDING hasta validarlos.
  const status = input.status ?? (service.requiresDocuments ? 'PENDING' : 'CONFIRMED');

  try {
    const created = await prisma.agendaAppointment.create({
      data: {
        organizationId: scope.organizationId,
        clinicId: scope.clinicId ?? null,
        resourceId,
        serviceId,
        patientName,
        patientPhone,
        patientEmail,
        patientDocument: (input.patientDocument ?? '').trim() || null,
        slotStart: start,
        slotEnd: end,
        status,
        source: input.channel ?? 'DASHBOARD',
        leadId: input.leadId ?? null,
        conversationId: input.conversationId ?? null,
        notes: (input.notes ?? '').trim() || null,
        createdByUserId: input.createdByUserId ?? null,
        assignedToUserId: input.assignedToUserId ?? null,
        callId: input.callId ?? null,
        calendarUid: crypto.randomUUID(),
        ...(status === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
      },
      include: appointmentInclude,
    });

    if (holdToken) {
      await prisma.appointmentHold.update({
        where: { holdToken },
        data: { consumedAt: new Date() },
      });
    }

    await logAgendaEvent({
      type: 'APPOINTMENT_CREATED',
      channel: input.channel ?? 'DASHBOARD',
      appointmentId: created.id,
      resourceId,
      actorUserId: input.createdByUserId ?? null,
      message: `${service.name} agendada para ${patientName}`,
      metadata: {
        slotStart: start.toISOString(),
        status,
        holdToken,
        callId: input.callId ?? null,
      },
    });

    return { ok: true, appointment: toAppointmentView(created, timezone) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail('SLOT_UNAVAILABLE', 'Ese horario acaba de ocuparse. Ofrezca otro cupo.');
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Cambios de estado, cancelación y reprogramación
// ---------------------------------------------------------------------------

const STATUS_TIMESTAMPS: Record<string, 'confirmedAt' | 'checkedInAt' | 'completedAt'> = {
  CONFIRMED: 'confirmedAt',
  CHECKED_IN: 'checkedInAt',
  COMPLETED: 'completedAt',
};

export async function getAppointment(
  scope: AgendaScope,
  appointmentId: string
): Promise<AgendaResult<{ appointment: AppointmentView }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const found = await prisma.agendaAppointment.findFirst({
    where: { id: appointmentId, ...organizationFilter(scope) },
    include: appointmentInclude,
  });
  if (!found) return fail('APPOINTMENT_NOT_FOUND', 'La cita no existe en esta organización.');

  return { ok: true, appointment: toAppointmentView(found, DEFAULT_TIMEZONE) };
}

export async function updateAppointmentStatus(
  scope: AgendaScope,
  input: {
    appointmentId: string;
    status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW';
    channel?: AgendaChannel;
    actorUserId?: string | null;
    actorLabel?: string | null;
    message?: string | null;
  }
): Promise<AgendaResult<{ appointment: AppointmentView }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const current = await prisma.agendaAppointment.findFirst({
    where: { id: input.appointmentId, ...organizationFilter(scope) },
    select: { id: true, status: true, resourceId: true },
  });
  if (!current) return fail('APPOINTMENT_NOT_FOUND', 'La cita no existe en esta organización.');

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REBOOKED'].includes(current.status)) {
    return fail(
      'APPOINTMENT_NOT_CHANGEABLE',
      `La cita ya está en estado ${current.status} y no admite más cambios.`
    );
  }

  const timestampField = STATUS_TIMESTAMPS[input.status];
  const updated = await prisma.agendaAppointment.update({
    where: { id: current.id },
    data: {
      status: input.status,
      ...(timestampField ? { [timestampField]: new Date() } : {}),
    },
    include: appointmentInclude,
  });

  const eventType =
    input.status === 'CONFIRMED'
      ? 'APPOINTMENT_CONFIRMED'
      : input.status === 'CHECKED_IN'
        ? 'APPOINTMENT_CHECKED_IN'
        : input.status === 'COMPLETED'
          ? 'APPOINTMENT_COMPLETED'
          : 'APPOINTMENT_NO_SHOW';

  await logAgendaEvent({
    type: eventType,
    channel: input.channel ?? 'DASHBOARD',
    appointmentId: current.id,
    resourceId: current.resourceId,
    actorUserId: input.actorUserId ?? null,
    actorLabel: input.actorLabel ?? null,
    message: input.message ?? `Estado actualizado a ${input.status}`,
  });

  return { ok: true, appointment: toAppointmentView(updated, DEFAULT_TIMEZONE) };
}

export async function cancelAppointment(
  scope: AgendaScope,
  input: {
    appointmentId: string;
    reason?: string | null;
    channel?: AgendaChannel;
    actorUserId?: string | null;
    actorLabel?: string | null;
  }
): Promise<
  AgendaResult<{
    appointment: AppointmentView;
    freedSlot: { resourceId: string; serviceId: string; slotStart: string; slotEnd: string };
    waitlistOffered: boolean;
  }>
> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const current = await prisma.agendaAppointment.findFirst({
    where: { id: input.appointmentId, ...organizationFilter(scope) },
    select: {
      id: true,
      status: true,
      resourceId: true,
      serviceId: true,
      slotStart: true,
      slotEnd: true,
    },
  });
  if (!current) return fail('APPOINTMENT_NOT_FOUND', 'La cita no existe en esta organización.');

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(current.status)) {
    return fail(
      'APPOINTMENT_NOT_CHANGEABLE',
      `La cita ya está ${current.status}; no se cancela dos veces.`
    );
  }

  const updated = await prisma.agendaAppointment.update({
    where: { id: current.id },
    data: {
      status: 'CANCELLED',
      cancelReason: (input.reason ?? '').trim() || null,
    },
    include: appointmentInclude,
  });

  await logAgendaEvent({
    type: 'APPOINTMENT_CANCELLED',
    channel: input.channel ?? 'DASHBOARD',
    appointmentId: current.id,
    resourceId: current.resourceId,
    actorUserId: input.actorUserId ?? null,
    actorLabel: input.actorLabel ?? null,
    message: input.reason ? `Cita cancelada: ${input.reason}` : 'Cita cancelada',
  });

  // El cupo liberado se ofrece de una vez a la lista de espera del servicio.
  let waitlistOffered = false;
  try {
    const offered = await offerSlotToWaitlist(scope, {
      serviceId: current.serviceId,
      resourceId: current.resourceId,
      slotStart: current.slotStart,
      slotEnd: current.slotEnd,
    });
    waitlistOffered = offered.ok ? offered.offered : false;
  } catch (error) {
    console.error('[agenda] no se pudo ofrecer el cupo liberado a la lista de espera', error);
  }

  return {
    ok: true,
    appointment: toAppointmentView(updated, DEFAULT_TIMEZONE),
    freedSlot: {
      resourceId: current.resourceId,
      serviceId: current.serviceId,
      slotStart: current.slotStart.toISOString(),
      slotEnd: current.slotEnd.toISOString(),
    },
    waitlistOffered,
  };
}

/**
 * Reprograma: crea la cita nueva con los mismos datos y marca la anterior REBOOKED.
 * Si el horario nuevo no se puede tomar, la cita original queda intacta.
 */
export async function rescheduleAppointment(
  scope: AgendaScope,
  input: {
    appointmentId: string;
    slotStart: string;
    resourceId?: string | null;
    holdToken?: string | null;
    channel?: AgendaChannel;
    actorUserId?: string | null;
    actorLabel?: string | null;
  }
): Promise<AgendaResult<{ appointment: AppointmentView; previousId: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const previous = await prisma.agendaAppointment.findFirst({
    where: { id: input.appointmentId, ...organizationFilter(scope) },
    select: {
      id: true,
      status: true,
      serviceId: true,
      patientName: true,
      patientPhone: true,
      patientEmail: true,
      patientDocument: true,
      leadId: true,
      conversationId: true,
    },
  });
  if (!previous) return fail('APPOINTMENT_NOT_FOUND', 'La cita no existe en esta organización.');
  if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REBOOKED'].includes(previous.status)) {
    return fail('APPOINTMENT_NOT_CHANGEABLE', `La cita está ${previous.status}; no se reprograma.`);
  }

  const booked = await bookAppointment(scope, {
    serviceId: previous.serviceId,
    slotStart: input.slotStart,
    resourceId: input.resourceId ?? null,
    holdToken: input.holdToken ?? null,
    patientName: previous.patientName,
    patientPhone: previous.patientPhone,
    patientEmail: previous.patientEmail,
    patientDocument: previous.patientDocument,
    channel: input.channel ?? 'DASHBOARD',
    leadId: previous.leadId,
    conversationId: previous.conversationId,
    createdByUserId: input.actorUserId ?? null,
    status: 'CONFIRMED',
  });

  if (!booked.ok) return booked;

  await prisma.agendaAppointment.update({
    where: { id: previous.id },
    data: { status: 'REBOOKED' },
  });

  await logAgendaEvent({
    type: 'APPOINTMENT_RESCHEDULED',
    channel: input.channel ?? 'DASHBOARD',
    appointmentId: booked.appointment.id,
    resourceId: booked.appointment.resourceId,
    actorUserId: input.actorUserId ?? null,
    actorLabel: input.actorLabel ?? null,
    message: `Reprogramada desde ${previous.id}`,
    metadata: { previousId: previous.id, newId: booked.appointment.id },
  });

  return { ok: true, appointment: booked.appointment, previousId: previous.id };
}

// ---------------------------------------------------------------------------
// Lista de espera
// ---------------------------------------------------------------------------

export type WaitlistInput = {
  serviceId: string;
  patientName: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  resourceId?: string | null;
  priority?: number;
  desiredFrom?: string | null;
  desiredTo?: string | null;
  notes?: string | null;
  channel?: AgendaChannel;
};

export async function addToWaitlist(
  scope: AgendaScope,
  input: WaitlistInput
): Promise<AgendaResult<{ entryId: string; position: number; serviceName: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const patientName = (input.patientName ?? '').trim();
  if (patientName.length < 2) {
    return fail('MISSING_PATIENT_DATA', 'Falta el nombre del paciente para la lista de espera.');
  }

  const patientPhone = (input.patientPhone ?? '').trim() || null;
  const patientEmail = (input.patientEmail ?? '').trim() || null;
  if (!patientPhone && !patientEmail) {
    return fail('MISSING_PATIENT_DATA', 'Necesitamos teléfono o correo para avisarle del cupo.');
  }

  const service = await serviceOffering.findFirst({
    where: { id: input.serviceId, ...organizationFilter(scope) },
    select: { id: true, name: true },
  });
  if (!service) return fail('SERVICE_NOT_FOUND', 'El servicio no existe en esta organización.');

  const priority = Math.min(Math.max(input.priority ?? 5, 1), 9);

  const entry = await prisma.waitlistEntry.create({
    data: {
      organizationId: scope.organizationId,
      clinicId: scope.clinicId ?? null,
      serviceId: service.id,
      resourceId: input.resourceId ?? null,
      patientName,
      patientPhone,
      patientEmail,
      priority,
      desiredFrom: input.desiredFrom ? new Date(input.desiredFrom) : null,
      desiredTo: input.desiredTo ? new Date(input.desiredTo) : null,
      notes: (input.notes ?? '').trim() || null,
    },
    select: { id: true },
  });

  const ahead = await prisma.waitlistEntry.count({
    where: { serviceId: service.id, status: 'WAITING', priority: { lt: priority } },
  });

  await logAgendaEvent({
    type: 'WAITLIST_ADDED',
    channel: input.channel ?? 'VOICE',
    message: `${patientName} en lista de espera de ${service.name}`,
    metadata: { entryId: entry.id, position: ahead + 1 },
  });

  return { ok: true, entryId: entry.id, position: ahead + 1, serviceName: service.name };
}

export async function listWaitlist(
  scope: AgendaScope,
  input: {
    serviceId?: string | null;
    status?: 'WAITING' | 'OFFERED' | 'BOOKED' | 'EXPIRED' | 'CANCELLED';
  } = {}
): Promise<
  AgendaResult<{
    entries: Array<{
      id: string;
      patientName: string;
      patientPhone: string | null;
      patientEmail: string | null;
      serviceId: string;
      serviceName: string;
      priority: number;
      status: string;
      offeredSlot: string | null;
      expiresAt: string | null;
      createdAt: string;
    }>;
  }>
> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const rows = await prisma.waitlistEntry.findMany({
    where: {
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
      ...(input.serviceId ? { serviceId: input.serviceId } : {}),
      status: input.status ?? 'WAITING',
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    take: 100,
    include: { service: { select: { name: true } } },
  });

  return {
    ok: true,
    entries: rows.map((row) => ({
      id: row.id,
      patientName: row.patientName,
      patientPhone: row.patientPhone,
      patientEmail: row.patientEmail,
      serviceId: row.serviceId,
      serviceName: row.service.name,
      priority: row.priority,
      status: row.status,
      offeredSlot: row.offeredSlot?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

/** Ofrece un cupo liberado al primero de la lista (menor `priority`, luego FIFO). */
export async function offerSlotToWaitlist(
  scope: AgendaScope,
  input: { serviceId: string; resourceId: string; slotStart: Date; slotEnd: Date }
): Promise<AgendaResult<{ offered: boolean; entryId?: string; expiresAt?: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const next = await prisma.waitlistEntry.findFirst({
    where: {
      serviceId: input.serviceId,
      status: 'WAITING',
      ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, patientName: true },
  });

  if (!next) return { ok: true, offered: false };

  const expiresAt = new Date(Date.now() + holdTtlMinutes() * 60 * 1000);

  await prisma.waitlistEntry.update({
    where: { id: next.id },
    data: {
      status: 'OFFERED',
      offeredSlot: input.slotStart,
      offeredAt: new Date(),
      expiresAt,
      resourceId: input.resourceId,
    },
  });

  await logAgendaEvent({
    type: 'WAITLIST_OFFERED',
    channel: 'API',
    resourceId: input.resourceId,
    message: `Cupo ofrecido a ${next.patientName}`,
    metadata: { entryId: next.id, slotStart: input.slotStart.toISOString() },
  });

  return { ok: true, offered: true, entryId: next.id, expiresAt: expiresAt.toISOString() };
}

/** El paciente aceptó el cupo ofrecido (después se agenda con `bookAppointment`). */
export async function markWaitlistConverted(
  scope: AgendaScope,
  entryId: string
): Promise<AgendaResult<{ converted: boolean }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      id: entryId,
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
    },
    select: { id: true },
  });
  if (!entry) return fail('WAITLIST_NOT_FOUND', 'No se encontró la entrada de lista de espera.');

  await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { status: 'BOOKED' } });

  await logAgendaEvent({
    type: 'WAITLIST_CONVERTED',
    channel: 'API',
    message: 'Cupo ofrecido convertido en cita',
    metadata: { entryId: entry.id },
  });

  return { ok: true, converted: true };
}

// ---------------------------------------------------------------------------
// Consultas para el panel y el agente
// ---------------------------------------------------------------------------

/** Normaliza un teléfono a dígitos: "+57 312 345 6789" y "3123456789" coinciden. */
export function normalizePhoneKey(phone?: string | null): string {
  return (phone ?? '').replace(/\D/g, '');
}

export async function findAppointmentsByPhone(
  scope: AgendaScope,
  input: { phone: string; includeFinished?: boolean }
): Promise<AgendaResult<{ appointments: AppointmentView[] }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const digits = normalizePhoneKey(input.phone);
  if (digits.length < 7) {
    return fail('INVALID_INPUT', 'El número de teléfono no parece válido.');
  }

  const rows = await prisma.agendaAppointment.findMany({
    where: {
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
      patientPhone: { contains: digits.slice(-7) },
      ...(input.includeFinished ? {} : { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } }),
    },
    orderBy: { slotStart: 'asc' },
    take: 20,
    include: appointmentInclude,
  });

  return { ok: true, appointments: rows.map((row) => toAppointmentView(row, DEFAULT_TIMEZONE)) };
}

export async function listAgendaRange(
  scope: AgendaScope,
  input: { fromDateKey: string; toDateKey: string; resourceId?: string | null; statuses?: string[] }
): Promise<AgendaResult<{ appointments: AppointmentView[] }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const from = new Date(`${input.fromDateKey}T00:00:00.000Z`);
  const to = new Date(`${input.toDateKey}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return fail('INVALID_INPUT', 'El rango de fechas no es válido (se espera YYYY-MM-DD).');
  }

  const rows = await prisma.agendaAppointment.findMany({
    where: {
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
      ...(input.resourceId ? { resourceId: input.resourceId } : {}),
      ...(input.statuses?.length ? { status: { in: input.statuses as never } } : {}),
      slotStart: { gte: from, lte: to },
    },
    orderBy: { slotStart: 'asc' },
    take: 400,
    include: appointmentInclude,
  });

  return { ok: true, appointments: rows.map((row) => toAppointmentView(row, DEFAULT_TIMEZONE)) };
}

// ---------------------------------------------------------------------------
// Configuración (lo que el panel necesita para operar)
// ---------------------------------------------------------------------------

export type AgendaConfigView = {
  timezone: string;
  resources: Array<{
    id: string;
    name: string;
    kind: string;
    timezone: string;
    email: string | null;
    phone: string | null;
    locationLabel: string | null;
    isActive: boolean;
    serviceIds: string[];
  }>;
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    slotStepMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    requiresDocuments: boolean;
    prepInstructions: string | null;
    color: string;
    isActive: boolean;
  }>;
  rules: Array<{
    id: string;
    resourceId: string;
    serviceId: string | null;
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    rangeLabel: string;
    isActive: boolean;
  }>;
};

export async function getAgendaConfig(
  scope: AgendaScope
): Promise<AgendaResult<{ config: AgendaConfigView }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const resourceScope = {
    organizationId: scope.organizationId,
    ...(scope.clinicId ? { OR: [{ clinicId: scope.clinicId }, { clinicId: null }] } : {}),
  };

  const resourceIds = (
    await prisma.scheduleResource.findMany({ where: resourceScope, select: { id: true } })
  ).map((resource) => resource.id);

  const [resources, services, links, rules] = await Promise.all([
    prisma.scheduleResource.findMany({
      where: resourceScope,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        kind: true,
        timezone: true,
        email: true,
        phone: true,
        locationLabel: true,
        isActive: true,
      },
    }),
    serviceOffering.findMany({
      where: organizationFilter(scope),
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        slotStepMinutes: true,
        bufferBeforeMinutes: true,
        bufferAfterMinutes: true,
        requiresDocuments: true,
        prepInstructions: true,
        color: true,
        isActive: true,
      },
    }),
    prisma.resourceService.findMany({
      where: { isActive: true, resourceId: { in: resourceIds } },
      select: { resourceId: true, serviceId: true },
    }),
    prisma.availabilityRule.findMany({
      where: { resourceId: { in: resourceIds }, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      select: {
        id: true,
        resourceId: true,
        serviceId: true,
        dayOfWeek: true,
        startMinute: true,
        endMinute: true,
        isActive: true,
      },
    }),
  ]);

  const timezone = await resolveAgendaTimezone(scope, resources[0]?.timezone);
  const serviceIdsByResource = new Map<string, string[]>();
  for (const link of links) {
    const bucket = serviceIdsByResource.get(link.resourceId) ?? [];
    bucket.push(link.serviceId);
    serviceIdsByResource.set(link.resourceId, bucket);
  }

  return {
    ok: true,
    config: {
      timezone,
      resources: resources.map((resource) => ({
        ...resource,
        serviceIds: serviceIdsByResource.get(resource.id) ?? [],
      })),
      services,
      rules: rules.map((rule) => ({
        id: rule.id,
        resourceId: rule.resourceId,
        serviceId: rule.serviceId,
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        rangeLabel: formatMinutesRange(rule.startMinute, rule.endMinute),
        isActive: rule.isActive,
      })),
    },
  };
}

export async function createScheduleResource(
  scope: AgendaScope,
  input: {
    name: string;
    kind?: 'PROFESSIONAL' | 'ROOM' | 'EQUIPMENT';
    timezone?: string | null;
    email?: string | null;
    phone?: string | null;
    locationLabel?: string | null;
    serviceIds?: string[];
  }
): Promise<AgendaResult<{ resourceId: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const name = (input.name ?? '').trim();
  if (name.length < 2) return fail('INVALID_INPUT', 'El recurso necesita un nombre de 2+ caracteres.');

  const timezone = await resolveAgendaTimezone(scope, input.timezone);

  const created = await prisma.scheduleResource.create({
    data: {
      organizationId: scope.organizationId,
      clinicId: scope.clinicId ?? null,
      name,
      kind: input.kind ?? 'PROFESSIONAL',
      timezone,
      email: (input.email ?? '').trim() || null,
      phone: (input.phone ?? '').trim() || null,
      locationLabel: (input.locationLabel ?? '').trim() || null,
    },
    select: { id: true },
  });

  const serviceIds = (input.serviceIds ?? []).filter(Boolean);
  if (serviceIds.length > 0) {
    const owned = await serviceOffering.findMany({
      where: { id: { in: serviceIds }, ...organizationFilter(scope) },
      select: { id: true },
    });
    if (owned.length > 0) {
      await prisma.resourceService.createMany({
        data: owned.map((service: { id: string }) => ({ resourceId: created.id, serviceId: service.id })),
        skipDuplicates: true,
      });
    }
  }

  await logAgendaEvent({
    type: 'APPOINTMENT_CREATED',
    channel: 'DASHBOARD',
    resourceId: created.id,
    message: `Recurso creado: ${name}`,
    metadata: { kind: input.kind ?? 'PROFESSIONAL', serviceIds },
  });

  return { ok: true, resourceId: created.id };
}

export async function createServiceOffering(
  scope: AgendaScope,
  input: {
    name: string;
    durationMinutes?: number;
    slotStepMinutes?: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    requiresDocuments?: boolean;
    requiredDocumentType?: string | null;
    prepInstructions?: string | null;
    color?: string;
    resourceIds?: string[];
  }
): Promise<AgendaResult<{ serviceId: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const name = (input.name ?? '').trim();
  if (name.length < 2) return fail('INVALID_INPUT', 'El servicio necesita un nombre de 2+ caracteres.');

  const durationMinutes = Math.min(Math.max(input.durationMinutes ?? 30, 5), 480);

  const created = await serviceOffering.create({
    data: {
      organizationId: scope.organizationId,
      clinicId: scope.clinicId ?? null,
      name,
      durationMinutes,
      slotStepMinutes: Math.min(Math.max(input.slotStepMinutes ?? 15, 5), durationMinutes),
      bufferBeforeMinutes: Math.min(Math.max(input.bufferBeforeMinutes ?? 0, 0), 120),
      bufferAfterMinutes: Math.min(Math.max(input.bufferAfterMinutes ?? 0, 0), 120),
      requiresDocuments: Boolean(input.requiresDocuments),
      requiredDocumentType: (input.requiredDocumentType ?? '').trim() || null,
      prepInstructions: (input.prepInstructions ?? '').trim() || null,
      color: /^#[0-9a-fA-F]{6}$/.test(input.color ?? '') ? (input.color as string) : '#0EA5E9',
    },
    select: { id: true },
  });

  const resourceIds = (input.resourceIds ?? []).filter(Boolean);
  if (resourceIds.length > 0) {
    const owned = await prisma.scheduleResource.findMany({
      where: {
        id: { in: resourceIds },
        organizationId: scope.organizationId,
        ...(scope.clinicId ? { OR: [{ clinicId: scope.clinicId }, { clinicId: null }] } : {}),
      },
      select: { id: true },
    });
    if (owned.length > 0) {
      await prisma.resourceService.createMany({
        data: owned.map((resource) => ({ resourceId: resource.id, serviceId: created.id })),
        skipDuplicates: true,
      });
    }
  }

  await logAgendaEvent({
    type: 'APPOINTMENT_CREATED',
    channel: 'DASHBOARD',
    message: `Servicio creado: ${name} (${durationMinutes} min)`,
    metadata: { serviceId: created.id, resourceIds },
  });

  return { ok: true, serviceId: created.id };
}

/** Reemplaza el horario semanal completo de un recurso (idempotente). */
export async function replaceWeeklyRules(
  scope: AgendaScope,
  input: {
    resourceId: string;
    rules: Array<{
      dayOfWeek: number;
      startMinute: number;
      endMinute: number;
      serviceId?: string | null;
    }>;
  }
): Promise<AgendaResult<{ count: number }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  const resource = await prisma.scheduleResource.findFirst({
    where: {
      id: input.resourceId,
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { OR: [{ clinicId: scope.clinicId }, { clinicId: null }] } : {}),
    },
    select: { id: true },
  });
  if (!resource) return fail('RESOURCE_NOT_FOUND', 'El recurso no existe en esta organización.');

  const valid = (input.rules ?? []).filter(
    (rule) =>
      Number.isInteger(rule.dayOfWeek) &&
      rule.dayOfWeek >= 0 &&
      rule.dayOfWeek <= 6 &&
      Number.isFinite(rule.startMinute) &&
      Number.isFinite(rule.endMinute) &&
      rule.startMinute >= 0 &&
      rule.endMinute <= 1440 &&
      rule.startMinute < rule.endMinute
  );

  if (valid.length === 0) {
    return fail('INVALID_INPUT', 'No se recibió ningún bloque de horario válido (0-1440 min).');
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { resourceId: resource.id } }),
    prisma.availabilityRule.createMany({
      data: valid.map((rule) => ({
        resourceId: resource.id,
        serviceId: rule.serviceId ?? null,
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        isActive: true,
      })),
    }),
  ]);

  await logAgendaEvent({
    type: 'APPOINTMENT_CREATED',
    channel: 'DASHBOARD',
    resourceId: resource.id,
    message: `Horario semanal actualizado (${valid.length} bloques)`,
    metadata: { rules: valid },
  });

  return { ok: true, count: valid.length };
}

/** Festivo, día de capacitación, ausencia parcial o apertura extraordinaria. */
export async function addAvailabilityException(
  scope: AgendaScope,
  input: {
    resourceId: string;
    dateKey: string;
    kind: 'TIME_OFF' | 'HOLIDAY' | 'EXTRA_OPENING';
    allDay?: boolean;
    startMinute?: number | null;
    endMinute?: number | null;
    reason?: string | null;
  }
): Promise<AgendaResult<{ exceptionId: string }>> {
  const scopeError = requireScope(scope);
  if (scopeError) return scopeError;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateKey ?? '')) {
    return fail('INVALID_INPUT', 'La fecha debe venir como YYYY-MM-DD.');
  }

  const resource = await prisma.scheduleResource.findFirst({
    where: {
      id: input.resourceId,
      organizationId: scope.organizationId,
      ...(scope.clinicId ? { OR: [{ clinicId: scope.clinicId }, { clinicId: null }] } : {}),
    },
    select: { id: true },
  });
  if (!resource) return fail('RESOURCE_NOT_FOUND', 'El recurso no existe en esta organización.');

  const allDay = input.kind === 'HOLIDAY' ? true : input.allDay !== false;

  if (!allDay) {
    const startMinute = input.startMinute ?? 0;
    const endMinute = input.endMinute ?? 0;
    if (endMinute <= startMinute) {
      return fail('INVALID_INPUT', 'El bloque de la excepción debe terminar después de empezar.');
    }
  }

  const created = await prisma.availabilityException.create({
    data: {
      resourceId: resource.id,
      date: new Date(`${input.dateKey}T00:00:00.000Z`),
      kind: input.kind,
      allDay,
      startMinute: allDay ? null : (input.startMinute ?? 0),
      endMinute: allDay ? null : (input.endMinute ?? 0),
      reason: (input.reason ?? '').trim() || null,
    },
    select: { id: true },
  });

  await logAgendaEvent({
    type: 'APPOINTMENT_CREATED',
    channel: 'DASHBOARD',
    resourceId: resource.id,
    message: `Excepción ${input.kind} el ${input.dateKey}`,
    metadata: { exceptionId: created.id, allDay },
  });

  return { ok: true, exceptionId: created.id };
}

export { fail as agendaFailWith };

