/**
 * Textos que el agente de voz (Telnyx) dice al paciente.
 * Funciones puras: la API de tools solo compone el resultado, así que
 * el contenido hablado se puede revisar y probar sin llamar a Telnyx.
 */

import { formatSpokenDateTime, humanDuration, joinSpokenList, statusLabel } from './format';

export type SpokenSlot = { start: Date; startLabel: string; endLabel: string };

export type SpokenAvailabilityInput = {
  serviceName: string;
  dateKeyLabel: string;
  timeZone: string;
  slots: SpokenSlot[];
  resourceName?: string | null;
  maxOffered?: number;
};

/** "Para Consulta general el miércoles, 16 de septiembre tengo 09:00, 09:30 y 10:00." */
export function availabilitySpoken(input: SpokenAvailabilityInput): string {
  const { serviceName, dateKeyLabel, slots, resourceName, maxOffered = 4 } = input;

  if (slots.length === 0) {
    return noAvailabilitySpoken({ serviceName, dateKeyLabel, resourceName });
  }

  const label = joinSpokenList(
    slots.map((slot) => slot.startLabel),
    maxOffered
  );
  const who = resourceName ? ` con ${resourceName}` : '';
  const remaining = slots.length > maxOffered ? ` Hay ${slots.length - maxOffered} horarios más.` : '';

  return `Para ${serviceName}${who} el ${dateKeyLabel} tengo ${label}.${remaining} ¿Cuál le sirve?`;
}

export function noAvailabilitySpoken(input: {
  serviceName: string;
  dateKeyLabel: string;
  resourceName?: string | null;
}): string {
  const who = input.resourceName ? ` con ${input.resourceName}` : '';
  return `No tengo cupos para ${input.serviceName}${who} el ${input.dateKeyLabel}. ¿Le busco el día hábil más cercano o lo dejo en lista de espera?`;
}

/** "Le aparto el miércoles 16 de septiembre a las 09:30 por 10 minutos…" */
export function holdSpoken(input: {
  slotStart: Date;
  timeZone: string;
  serviceName: string;
  holdMinutes: number;
  resourceName?: string | null;
}): string {
  const who = input.resourceName ? ` con ${input.resourceName}` : '';
  return `Le aparto ${input.serviceName}${who} el ${formatSpokenDateTime(input.slotStart, input.timeZone)}. Mantengo el cupo ${humanDuration(input.holdMinutes)} mientras confirmamos sus datos.`;
}

export function holdExpiredSpoken(): string {
  return 'El cupo que aparté ya se liberó. ¿Quiere que le busque otro horario?';
}

export function slotUnavailableSpoken(): string {
  return 'Ese horario acaba de ocuparse. ¿Le ofrezco el más cercano disponible?';
}

export function bookingConfirmedSpoken(input: {
  slotStart: Date;
  timeZone: string;
  serviceName: string;
  resourceName?: string | null;
  emailSentTo?: string | null;
}): string {
  const who = input.resourceName ? ` con ${input.resourceName}` : '';
  const confirmation = input.emailSentTo
    ? ` Le envío la confirmación a ${input.emailSentTo}.`
    : ' Le envío la confirmación por correo.';
  return `Listo, quedó agendada su ${input.serviceName}${who} el ${formatSpokenDateTime(input.slotStart, input.timeZone)}.${confirmation}`;
}

export function rescheduledSpoken(input: {
  slotStart: Date;
  timeZone: string;
  serviceName: string;
}): string {
  return `Quedó reprogramada su ${input.serviceName} para el ${formatSpokenDateTime(input.slotStart, input.timeZone)}. Ya le envié el correo con la nueva fecha.`;
}

export function cancelledSpoken(input: {
  slotLabel?: string | null;
  serviceName: string;
}): string {
  const when = input.slotLabel ? ` del ${input.slotLabel}` : '';
  return `Cancelé su ${input.serviceName}${when}. El cupo vuelve a quedar libre y le envié la confirmación por correo.`;
}

export function waitlistSpoken(input: {
  serviceName: string;
  position?: number | null;
}): string {
  const position = input.position ? ` Es el turno ${input.position} en la lista.` : '';
  return `Lo agrego a la lista de espera de ${input.serviceName}.${position} Si se libera un cupo le escribo de inmediato.`;
}

export function waitlistOfferSpoken(input: {
  slotStart: Date;
  timeZone: string;
  serviceName: string;
  expiresInMinutes: number;
}): string {
  return `Se liberó un cupo para ${input.serviceName} el ${formatSpokenDateTime(input.slotStart, input.timeZone)}. Se lo reservo ${humanDuration(input.expiresInMinutes)}; si me confirma ahora queda suyo.`;
}

export function statusSpoken(status: string): string {
  return `La cita quedó ${statusLabel(status).toLowerCase()}.`;
}

export function spokenListOfAppointments(
  appointments: Array<{ slotStart: Date; serviceName: string; status: string }>,
  timeZone: string
): string {
  if (appointments.length === 0) {
    return 'No encontré citas registradas con ese número. ¿Quiere que le agende una?';
  }

  const parts = appointments.map(
    (appointment) =>
      `${appointment.serviceName} el ${formatSpokenDateTime(appointment.slotStart, timeZone)} (${statusLabel(appointment.status).toLowerCase()})`
  );

  return `Tiene ${appointments.length === 1 ? 'una cita' : `${appointments.length} citas`}: ${joinSpokenList(parts, 4)}.`;
}

export function missingDataSpoken(field: 'nombre' | 'telefono' | 'correo'): string {
  const labels = {
    nombre: 'el nombre completo del paciente',
    telefono: 'un número de contacto',
    correo: 'un correo para enviarle la confirmación',
  };
  return `Para dejarlo agendado necesito ${labels[field]}. ¿Me lo confirma, por favor?`;
}
