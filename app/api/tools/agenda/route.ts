import { NextRequest, NextResponse } from 'next/server';
import { verifySharedSecret } from '@/lib/webhook-verify';
import {
  addToWaitlist,
  bookAppointment,
  cancelAppointment,
  computeAvailability,
  findAppointmentsByPhone,
  findNextAvailableDay,
  getAgendaConfig,
  holdSlot,
  releaseHold,
  rescheduleAppointment,
  type AgendaScope,
} from '@/lib/agenda/service';
import {
  availabilitySpoken,
  bookingConfirmedSpoken,
  cancelledSpoken,
  holdSpoken,
  missingDataSpoken,
  noAvailabilitySpoken,
  rescheduledSpoken,
  slotUnavailableSpoken,
  spokenListOfAppointments,
  waitlistSpoken,
} from '@/lib/agenda/voice-responses';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Herramientas de la Agenda Premium para el agente de voz (Telnyx AI Assistant).
 *
 * Un solo endpoint con `action` para que el asistente tenga un único webhook tool.
 * Autenticación servidor-a-servidor con `TELNYX_TOOL_SECRET` (header o Bearer).
 * El alcance del tenant viaja en el body o en los headers del tool.
 *
 * Contrato: casi siempre responde 200 con `speak` (texto listo para TTS),
 * incluso en errores de negocio, para que el agente pueda explicar y ofrecer
 * alternativas en vez de quedarse en silencio.
 */

type ToolBody = Record<string, unknown>;

function text(body: ToolBody, key: string): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numeric(body: ToolBody, key: string): number | null {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function scopeFrom(request: NextRequest, body: ToolBody): AgendaScope | null {
  const organizationId =
    text(body, 'organizationId') ?? request.headers.get('x-upway-organization-id');
  if (!organizationId) return null;
  const clinicId = text(body, 'clinicId') ?? request.headers.get('x-upway-clinic-id') ?? undefined;
  return { organizationId, clinicId };
}

function speakOnly(message: string, status = 200) {
  return NextResponse.json({ ok: false, speak: message }, { status });
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELNYX_TOOL_SECRET;
  if (!secret) {
    console.error('[tools:agenda] TELNYX_TOOL_SECRET no está configurado. Tool rechazado.');
    return NextResponse.json({ error: 'Tool not configured' }, { status: 503 });
  }

  const provided =
    request.headers.get('x-upway-tool-secret') ??
    (request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null);

  if (!verifySharedSecret(provided, secret)) {
    console.warn('[tools:agenda] secreto de tool inválido. Llamada descartada.');
    return NextResponse.json({ error: 'Invalid tool secret' }, { status: 401 });
  }

  let body: ToolBody;
  try {
    body = (await request.json()) as ToolBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const action = text(body, 'action');
  if (!action) return speakOnly('No recibí la acción que debo ejecutar.');

  const scope = scopeFrom(request, body);
  if (!scope) {
    return NextResponse.json(
      { error: 'Falta organizationId (body o header x-upway-organization-id)' },
      { status: 400 }
    );
  }

  const now = new Date();

  switch (action) {
    case 'list_services': {
      const config = await getAgendaConfig(scope);
      if (!config.ok) return speakOnly(config.message);

      const active = config.config.services.filter((service) => service.isActive);
      if (active.length === 0) {
        return NextResponse.json({
          ok: false,
          speak: 'Todavía no tengo servicios configurados para agendar.',
          services: [],
        });
      }

      return NextResponse.json({
        ok: true,
        speak: `Puedo agendar: ${active.map((service) => service.name).join(', ')}.`,
        services: active.map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          requiresDocuments: service.requiresDocuments,
        })),
      });
    }

    case 'check_availability': {
      const serviceId = text(body, 'serviceId');
      if (!serviceId) return speakOnly('Necesito saber para qué servicio busco el cupo.');

      const result = await computeAvailability(scope, {
        serviceId,
        dateKey: text(body, 'dateKey') ?? undefined,
        days: Math.min(Math.max(numeric(body, 'days') ?? 1, 1), 14),
        resourceId: text(body, 'resourceId'),
        now,
      });
      if (!result.ok) return speakOnly(result.message);

      const day = result.days.find((candidate) => candidate.slots.length > 0) ?? result.days[0];
      const resourceName = day?.slots[0]?.resourceName ?? null;
      const speak =
        !day || day.slots.length === 0
          ? noAvailabilitySpoken({
              serviceName: result.service.name,
              dateKeyLabel: day?.dateLabel ?? '',
              resourceName,
            })
          : availabilitySpoken({
              serviceName: result.service.name,
              dateKeyLabel: day.dateLabel,
              timeZone: result.timezone,
              slots: day.slots.map((slot) => ({
                start: new Date(slot.start),
                startLabel: slot.startLabel,
                endLabel: slot.endLabel,
              })),
              resourceName,
            });

      return NextResponse.json({
        ok: true,
        speak,
        service: {
          id: result.service.id,
          name: result.service.name,
          durationMinutes: result.service.durationMinutes,
        },
        timezone: result.timezone,
        days: result.days,
      });
    }

    case 'find_next_availability': {
      const serviceId = text(body, 'serviceId');
      if (!serviceId) return speakOnly('Necesito saber para qué servicio busco el cupo.');

      const fromDateKey = text(body, 'fromDateKey') ?? text(body, 'dateKey');
      if (!fromDateKey) return speakOnly('Necesito la fecha desde la que empiezo a buscar.');

      const result = await findNextAvailableDay(scope, {
        serviceId,
        fromDateKey,
        searchDays: Math.min(Math.max(numeric(body, 'searchDays') ?? 14, 1), 31),
        resourceId: text(body, 'resourceId'),
        now,
      });
      if (!result.ok) return speakOnly(result.message);

      if (!result.found) {
        return NextResponse.json({
          ok: true,
          found: false,
          speak:
            'No encontré cupos en los próximos días para ese servicio. Puedo dejarle el registro en lista de espera.',
        });
      }

      return NextResponse.json({
        ok: true,
        found: true,
        dateKey: result.dateKey,
        dateLabel: result.dateLabel,
        slots: result.slots,
        speak: availabilitySpoken({
          serviceName: text(body, 'serviceName') ?? 'el servicio',
          dateKeyLabel: result.dateLabel,
          timeZone: 'America/Bogota',
          slots: result.slots.map((slot) => ({
            start: new Date(slot.start),
            startLabel: slot.startLabel,
            endLabel: slot.endLabel,
          })),
          resourceName: result.slots[0]?.resourceName ?? null,
        }),
      });
    }

    case 'hold_slot': {
      const serviceId = text(body, 'serviceId');
      const slotStart = text(body, 'slotStart');
      if (!serviceId || !slotStart) {
        return speakOnly('Necesito el servicio y el horario que debo apartar.');
      }

      const result = await holdSlot(scope, {
        serviceId,
        slotStart,
        resourceId: text(body, 'resourceId'),
        channel: 'VOICE',
        callId: text(body, 'callId'),
      });

      if (!result.ok) {
        const speak = result.code === 'SLOT_UNAVAILABLE' ? slotUnavailableSpoken() : result.message;
        return NextResponse.json({ ok: false, code: result.code, speak });
      }

      return NextResponse.json({
        ok: true,
        speak: holdSpoken({
          slotStart: new Date(result.slotStart),
          timeZone: result.timezone,
          serviceName: result.serviceName,
          holdMinutes: result.holdMinutes,
          resourceName: result.resourceName,
        }),
        holdToken: result.holdToken,
        expiresAt: result.expiresAt,
        slotStart: result.slotStart,
        slotEnd: result.slotEnd,
        resourceId: result.resourceId,
      });
    }

    case 'release_hold': {
      const holdToken = text(body, 'holdToken');
      if (!holdToken) return speakOnly('No recibí el cupo apartado que debo liberar.');

      const result = await releaseHold(scope, holdToken);
      return NextResponse.json({
        ok: result.ok,
        speak: result.ok ? 'Liberé el cupo que tenía apartado.' : result.message,
      });
    }

    case 'book': {
      const holdToken = text(body, 'holdToken');
      const serviceId = text(body, 'serviceId');
      const slotStart = text(body, 'slotStart');
      const patientName = text(body, 'patientName');
      const patientPhone = text(body, 'patientPhone');
      const patientEmail = text(body, 'patientEmail');

      if (!holdToken && (!serviceId || !slotStart)) {
        return speakOnly('Necesito el servicio y el horario para dejar la cita.');
      }
      if (!patientName) return speakOnly(missingDataSpoken('nombre'));
      if (!patientPhone && !patientEmail) return speakOnly(missingDataSpoken('telefono'));

      const result = await bookAppointment(scope, {
        serviceId: serviceId ?? '',
        slotStart: slotStart ?? '',
        holdToken,
        patientName,
        patientPhone,
        patientEmail,
        patientDocument: text(body, 'patientDocument'),
        notes: text(body, 'notes'),
        channel: 'VOICE',
        callId: text(body, 'callId'),
        leadId: text(body, 'leadId'),
        conversationId: text(body, 'conversationId'),
      });

      if (!result.ok) {
        const speak =
          result.code === 'SLOT_UNAVAILABLE'
            ? slotUnavailableSpoken()
            : result.code === 'HOLD_EXPIRED'
              ? 'El cupo que aparté ya se liberó. ¿Le busco otro horario?'
              : result.message;
        return NextResponse.json({ ok: false, code: result.code, speak });
      }

      const { appointment } = result;
      return NextResponse.json({
        ok: true,
        speak: bookingConfirmedSpoken({
          slotStart: new Date(appointment.slotStart),
          timeZone: appointment.timezone,
          serviceName: appointment.serviceName,
          resourceName: appointment.resourceName,
          emailSentTo: appointment.patientEmail,
        }),
        appointment,
        requiresDocuments: appointment.requiresDocuments,
        prepInstructions: appointment.prepInstructions,
      });
    }

    case 'reschedule': {
      const appointmentId = text(body, 'appointmentId');
      const slotStart = text(body, 'slotStart');
      if (!appointmentId || !slotStart) {
        return speakOnly('Necesito la cita y el nuevo horario para reprogramarla.');
      }

      const result = await rescheduleAppointment(scope, {
        appointmentId,
        slotStart,
        resourceId: text(body, 'resourceId'),
        holdToken: text(body, 'holdToken'),
        channel: 'VOICE',
      });

      if (!result.ok) {
        const speak =
          result.code === 'SLOT_UNAVAILABLE'
            ? slotUnavailableSpoken()
            : result.code === 'APPOINTMENT_NOT_FOUND'
              ? 'No encontré esa cita para reprogramarla.'
              : result.message;
        return NextResponse.json({ ok: false, code: result.code, speak });
      }

      return NextResponse.json({
        ok: true,
        speak: rescheduledSpoken({
          slotStart: new Date(result.appointment.slotStart),
          timeZone: result.appointment.timezone,
          serviceName: result.appointment.serviceName,
        }),
        appointment: result.appointment,
        previousId: result.previousId,
      });
    }

    case 'cancel': {
      const appointmentId = text(body, 'appointmentId');
      if (!appointmentId) return speakOnly('Necesito saber qué cita debo cancelar.');

      const result = await cancelAppointment(scope, {
        appointmentId,
        reason: text(body, 'reason'),
        channel: 'VOICE',
      });

      if (!result.ok) {
        const speak =
          result.code === 'APPOINTMENT_NOT_FOUND'
            ? 'No encontré esa cita registrada.'
            : result.message;
        return NextResponse.json({ ok: false, code: result.code, speak });
      }

      const slotLabel = new Date(result.appointment.slotStart).toLocaleString('es-CO', {
        timeZone: result.appointment.timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return NextResponse.json({
        ok: true,
        speak: cancelledSpoken({ serviceName: result.appointment.serviceName, slotLabel }),
        appointment: result.appointment,
        waitlistOffered: result.waitlistOffered,
      });
    }

    case 'find_patient_appointments': {
      const phone = text(body, 'phone');
      if (!phone) return speakOnly(missingDataSpoken('telefono'));

      const result = await findAppointmentsByPhone(scope, {
        phone,
        includeFinished: body.includeFinished === true,
      });
      if (!result.ok) return speakOnly(result.message);

      return NextResponse.json({
        ok: true,
        speak: spokenListOfAppointments(
          result.appointments.map((appointment) => ({
            slotStart: new Date(appointment.slotStart),
            serviceName: appointment.serviceName,
            status: appointment.status,
          })),
          result.appointments[0]?.timezone ?? 'America/Bogota'
        ),
        appointments: result.appointments,
      });
    }

    case 'waitlist_add': {
      const serviceId = text(body, 'serviceId');
      const patientName = text(body, 'patientName');
      const patientPhone = text(body, 'patientPhone');
      const patientEmail = text(body, 'patientEmail');

      if (!serviceId) return speakOnly('Necesito saber para qué servicio lo dejo en lista de espera.');
      if (!patientName) return speakOnly(missingDataSpoken('nombre'));
      if (!patientPhone && !patientEmail) return speakOnly(missingDataSpoken('telefono'));

      const result = await addToWaitlist(scope, {
        serviceId,
        patientName,
        patientPhone,
        patientEmail,
        resourceId: text(body, 'resourceId'),
        priority: numeric(body, 'priority') ?? undefined,
        desiredFrom: text(body, 'desiredFrom'),
        desiredTo: text(body, 'desiredTo'),
        notes: text(body, 'notes'),
        channel: 'VOICE',
      });

      if (!result.ok) return speakOnly(result.message);

      return NextResponse.json({
        ok: true,
        speak: waitlistSpoken({ serviceName: result.serviceName, position: result.position }),
        entryId: result.entryId,
        position: result.position,
      });
    }

    default:
      return speakOnly(
        `No reconozco la acción ${action}. Puedo consultar cupos, agendar, reprogramar, cancelar o dejar en lista de espera.`
      );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'agenda-tools',
    actions: [
      'list_services',
      'check_availability',
      'find_next_availability',
      'hold_slot',
      'release_hold',
      'book',
      'reschedule',
      'cancel',
      'find_patient_appointments',
      'waitlist_add',
    ],
    configured: Boolean(process.env.TELNYX_TOOL_SECRET),
  });
}

