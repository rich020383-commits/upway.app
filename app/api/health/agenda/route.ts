import { NextRequest, NextResponse } from 'next/server';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import {
  addAvailabilityException,
  addToWaitlist,
  bookAppointment,
  cancelAppointment,
  computeAvailability,
  createScheduleResource,
  createServiceOffering,
  expireStaleHolds,
  getAgendaConfig,
  holdSlot,
  listAgendaRange,
  listWaitlist,
  replaceWeeklyRules,
  rescheduleAppointment,
  todayDateKey,
  updateAppointmentStatus,
  type AgendaErrorCode,
  type AgendaScope,
} from '@/lib/agenda/service';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * API de la Agenda Premium para el panel (/health/agenda).
 * - Guard: sesión + permisos health (módulo `production`) + tenant scope.
 * - GET  ?view=appointments|availability|config|waitlist
 * - POST { action, ... } para reservar, mover, cancelar, cambiar estado y configurar.
 */

function statusForCode(code: AgendaErrorCode): number {
  switch (code) {
    case 'SCOPE_REQUIRED':
      return 403;
    case 'INVALID_INPUT':
    case 'MISSING_PATIENT_DATA':
      return 400;
    case 'SERVICE_NOT_FOUND':
    case 'RESOURCE_NOT_FOUND':
    case 'APPOINTMENT_NOT_FOUND':
    case 'WAITLIST_NOT_FOUND':
    case 'HOLD_NOT_FOUND':
      return 404;
    case 'SLOT_UNAVAILABLE':
    case 'HOLD_EXPIRED':
    case 'HOLD_ALREADY_USED':
    case 'APPOINTMENT_NOT_CHANGEABLE':
    case 'RESOURCE_NOT_ELIGIBLE':
      return 409;
    default:
      return 400;
  }
}

function failure(result: { ok: false; code: AgendaErrorCode; message: string }) {
  return NextResponse.json({ ok: false, code: result.code, error: result.message }, {
    status: statusForCode(result.code),
  });
}

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId, user } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  const scope: AgendaScope = { organizationId, clinicId };
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') ?? 'appointments';

  try {
    if (view === 'config') {
      const result = await getAgendaConfig(scope);
      if (!result.ok) return failure(result);
      return NextResponse.json(
        withTenantScope({ ok: true, config: result.config }, scope)
      );
    }

    if (view === 'availability') {
      const serviceId = searchParams.get('serviceId');
      if (!serviceId) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', error: 'Falta serviceId para calcular cupos.' },
          { status: 400 }
        );
      }

      const result = await computeAvailability(scope, {
        serviceId,
        dateKey: searchParams.get('dateKey') ?? undefined,
        days: Number(searchParams.get('days') ?? '7') || 7,
        resourceId: searchParams.get('resourceId'),
      });
      if (!result.ok) return failure(result);

      return NextResponse.json(
        withTenantScope(
          {
            ok: true,
            service: result.service,
            timezone: result.timezone,
            days: result.days,
          },
          scope
        )
      );
    }

    if (view === 'waitlist') {
      const result = await listWaitlist(scope, {
        serviceId: searchParams.get('serviceId'),
        status: (searchParams.get('status') as never) ?? 'WAITING',
      });
      if (!result.ok) return failure(result);
      return NextResponse.json(withTenantScope({ ok: true, entries: result.entries }, scope));
    }

    // Vista por defecto: agenda de un rango de días.
    const timezone = 'America/Bogota';
    const fromDateKey = searchParams.get('from') ?? todayDateKey(timezone);
    const toDateKey = searchParams.get('to') ?? fromDateKey;

    const [appointments, config] = await Promise.all([
      listAgendaRange(scope, {
        fromDateKey,
        toDateKey,
        resourceId: searchParams.get('resourceId'),
      }),
      getAgendaConfig(scope),
    ]);

    if (!appointments.ok) return failure(appointments);

    return NextResponse.json(
      withTenantScope(
        {
          ok: true,
          from: fromDateKey,
          to: toDateKey,
          appointments: appointments.appointments,
          config: config.ok ? config.config : null,
          currentUser: { id: user.id, email: user.email ?? null, name: user.name ?? null },
        },
        scope
      )
    );
  } catch (err) {
    console.error('[api:health:agenda] GET falló', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo cargar la agenda' },
      { status: 500 }
    );
  }
}

type PostBody = Record<string, unknown>;

function str(body: PostBody, key: string): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function num(body: PostBody, key: string): number | null {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId, user } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  const scope: AgendaScope = { organizationId, clinicId };
  const actorLabel = user.name ?? user.email ?? 'panel';

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const action = str(body, 'action');
  if (!action) return NextResponse.json({ error: 'Falta action' }, { status: 400 });

  try {
    switch (action) {
      case 'book': {
        const result = await bookAppointment(scope, {
          serviceId: str(body, 'serviceId') ?? '',
          slotStart: str(body, 'slotStart') ?? '',
          patientName: str(body, 'patientName') ?? '',
          patientPhone: str(body, 'patientPhone'),
          patientEmail: str(body, 'patientEmail'),
          patientDocument: str(body, 'patientDocument'),
          notes: str(body, 'notes'),
          resourceId: str(body, 'resourceId'),
          holdToken: str(body, 'holdToken'),
          channel: 'DASHBOARD',
          leadId: str(body, 'leadId'),
          conversationId: str(body, 'conversationId'),
          assignedToUserId: str(body, 'assignedToUserId'),
          createdByUserId: user.id,
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope({ ok: true, appointment: result.appointment }, scope)
        );
      }

      case 'hold_slot': {
        const serviceId = str(body, 'serviceId');
        const slotStart = str(body, 'slotStart');
        if (!serviceId || !slotStart) {
          return NextResponse.json(
            { error: 'serviceId y slotStart son requeridos' },
            { status: 400 }
          );
        }
        const result = await holdSlot(scope, {
          serviceId,
          slotStart,
          resourceId: str(body, 'resourceId'),
          channel: 'DASHBOARD',
          createdByUserId: user.id,
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(withTenantScope({ ok: true, hold: result }, scope));
      }

      case 'reschedule': {
        const appointmentId = str(body, 'appointmentId');
        const slotStart = str(body, 'slotStart');
        if (!appointmentId || !slotStart) {
          return NextResponse.json(
            { error: 'appointmentId y slotStart son requeridos' },
            { status: 400 }
          );
        }
        const result = await rescheduleAppointment(scope, {
          appointmentId,
          slotStart,
          resourceId: str(body, 'resourceId'),
          holdToken: str(body, 'holdToken'),
          channel: 'DASHBOARD',
          actorUserId: user.id,
          actorLabel,
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope(
            { ok: true, appointment: result.appointment, previousId: result.previousId },
            scope
          )
        );
      }

      case 'cancel': {
        const appointmentId = str(body, 'appointmentId');
        if (!appointmentId) {
          return NextResponse.json({ error: 'appointmentId es requerido' }, { status: 400 });
        }
        const result = await cancelAppointment(scope, {
          appointmentId,
          reason: str(body, 'reason'),
          channel: 'DASHBOARD',
          actorUserId: user.id,
          actorLabel,
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope(
            {
              ok: true,
              appointment: result.appointment,
              freedSlot: result.freedSlot,
              waitlistOffered: result.waitlistOffered,
            },
            scope
          )
        );
      }

      case 'confirm':
      case 'check_in':
      case 'complete':
      case 'no_show': {
        const appointmentId = str(body, 'appointmentId');
        if (!appointmentId) {
          return NextResponse.json({ error: 'appointmentId es requerido' }, { status: 400 });
        }

        const statusMap = {
          confirm: 'CONFIRMED',
          check_in: 'CHECKED_IN',
          complete: 'COMPLETED',
          no_show: 'NO_SHOW',
        } as const;

        const result = await updateAppointmentStatus(scope, {
          appointmentId,
          status: statusMap[action as keyof typeof statusMap],
          channel: 'DASHBOARD',
          actorUserId: user.id,
          actorLabel,
          message: str(body, 'message'),
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope({ ok: true, appointment: result.appointment }, scope)
        );
      }

      case 'waitlist_add': {
        const result = await addToWaitlist(scope, {
          serviceId: str(body, 'serviceId') ?? '',
          patientName: str(body, 'patientName') ?? '',
          patientPhone: str(body, 'patientPhone'),
          patientEmail: str(body, 'patientEmail'),
          resourceId: str(body, 'resourceId'),
          priority: num(body, 'priority') ?? undefined,
          desiredFrom: str(body, 'desiredFrom'),
          desiredTo: str(body, 'desiredTo'),
          notes: str(body, 'notes'),
          channel: 'DASHBOARD',
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope({ ok: true, entryId: result.entryId, position: result.position }, scope)
        );
      }

      case 'resource_create': {
        const result = await createScheduleResource(scope, {
          name: str(body, 'name') ?? '',
          kind: (str(body, 'kind') as 'PROFESSIONAL' | 'ROOM' | 'EQUIPMENT' | null) ?? undefined,
          timezone: str(body, 'timezone'),
          email: str(body, 'email'),
          phone: str(body, 'phone'),
          locationLabel: str(body, 'locationLabel'),
          serviceIds: Array.isArray(body.serviceIds) ? (body.serviceIds as string[]) : [],
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(withTenantScope({ ok: true, resourceId: result.resourceId }, scope));
      }

      case 'service_create': {
        const result = await createServiceOffering(scope, {
          name: str(body, 'name') ?? '',
          durationMinutes: num(body, 'durationMinutes') ?? undefined,
          slotStepMinutes: num(body, 'slotStepMinutes') ?? undefined,
          bufferBeforeMinutes: num(body, 'bufferBeforeMinutes') ?? undefined,
          bufferAfterMinutes: num(body, 'bufferAfterMinutes') ?? undefined,
          requiresDocuments: body.requiresDocuments === true,
          requiredDocumentType: str(body, 'requiredDocumentType'),
          prepInstructions: str(body, 'prepInstructions'),
          color: str(body, 'color') ?? undefined,
          resourceIds: Array.isArray(body.resourceIds) ? (body.resourceIds as string[]) : [],
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(withTenantScope({ ok: true, serviceId: result.serviceId }, scope));
      }

      case 'rules_replace': {
        const resourceId = str(body, 'resourceId');
        if (!resourceId || !Array.isArray(body.rules)) {
          return NextResponse.json(
            { error: 'resourceId y rules[] son requeridos' },
            { status: 400 }
          );
        }
        const result = await replaceWeeklyRules(scope, {
          resourceId,
          rules: body.rules as Array<{
            dayOfWeek: number;
            startMinute: number;
            endMinute: number;
            serviceId?: string | null;
          }>,
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(withTenantScope({ ok: true, count: result.count }, scope));
      }

      case 'exception_create': {
        const resourceId = str(body, 'resourceId');
        const dateKey = str(body, 'dateKey');
        const kind = str(body, 'kind') as 'TIME_OFF' | 'HOLIDAY' | 'EXTRA_OPENING' | null;

        if (!resourceId || !dateKey || !kind) {
          return NextResponse.json(
            { error: 'resourceId, dateKey y kind son requeridos' },
            { status: 400 }
          );
        }

        const result = await addAvailabilityException(scope, {
          resourceId,
          dateKey,
          kind,
          allDay: body.allDay === true,
          startMinute: num(body, 'startMinute'),
          endMinute: num(body, 'endMinute'),
          reason: str(body, 'reason'),
        });
        if (!result.ok) return failure(result);
        return NextResponse.json(
          withTenantScope({ ok: true, exceptionId: result.exceptionId }, scope)
        );
      }

      case 'holds_expire': {
        const result = await expireStaleHolds();
        return NextResponse.json(withTenantScope({ ok: true, expired: result.expired }, scope));
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[api:health:agenda] POST falló', action, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo completar la operación' },
      { status: 500 }
    );
  }
}

