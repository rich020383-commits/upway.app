/**
 * Formato de fechas, horas y estados de la Agenda Premium Upway.
 * Funciones puras: sin Prisma, sin red, sin dependencias externas.
 * Se usan en el panel, en los correos y en las respuestas del agente de voz.
 */

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente de confirmar',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'En sala',
  COMPLETED: 'Atendida',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  REBOOKED: 'Reprogramada',
};

const CHANNEL_LABELS: Record<string, string> = {
  VOICE: 'Llamada',
  DASHBOARD: 'Panel',
  EMAIL: 'Correo',
  API: 'Integración',
  WALK_IN: 'Presencial',
};

const CAPACITY_NOTE: Record<string, string> = {
  CANCELLED: 'El cupo vuelve a quedar libre.',
  NO_SHOW: 'Se registró la inasistencia para el seguimiento.',
  REBOOKED: 'La cita quedó reemplazada por otra fecha.',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

/** Estados en los que la cita ya no ocupa cupo ni admite cambios de flujo. */
export function isTerminalStatus(status: string): boolean {
  return ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REBOOKED'].includes(status);
}

/** Estados que sí ocupan cupo en la agenda del recurso. */
export function occupiesCalendar(status: string): boolean {
  return !['CANCELLED', 'NO_SHOW', 'REBOOKED'].includes(status);
}

export function cancelNote(status: string): string | null {
  return CAPACITY_NOTE[status] ?? null;
}

/** "2026-09-16" → "miércoles, 16 de septiembre". Sin desfase de zona. */
export function formatDateKeyLabel(dateKey: string): string {
  const match = DATE_KEY_RE.exec(dateKey.trim());
  if (!match) throw new Error(`Fecha inválida (se espera YYYY-MM-DD): ${dateKey}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

/** "mié 16 sep · 09:30" en la zona horaria del recurso. */
export function formatDateTimeLabel(date: Date, timeZone: string): string {
  const formatted = new Intl.DateTimeFormat('es-CO', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return formatted.replace(/,/g, '·').replace(/\s+/g, ' ').trim();
}

/** "miércoles 16 a las 09:30" — para leerlo en voz alta. */
export function formatSpokenDateTime(date: Date, timeZone: string): string {
  const datePart = new Intl.DateTimeFormat('es-CO', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('es-CO', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} a las ${timePart}`;
}

/** 570, 600 → "09:30–10:00" */
export function formatMinutesRange(startMinute: number, endMinute: number): string {
  const label = (total: number) => {
    const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  };
  return `${label(startMinute)}–${label(endMinute)}`;
}

/** 30 → "30 minutos"; 90 → "1 hora y 30 minutos"; 120 → "2 horas". */
export function humanDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) return `${rest} ${rest === 1 ? 'minuto' : 'minutos'}`;
  const hourLabel = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (rest === 0) return hourLabel;
  return `${hourLabel} y ${rest} ${rest === 1 ? 'minuto' : 'minutos'}`;
}

/** Une etiquetas de hora en lenguaje natural: "09:00, 09:30 y 10:00". */
export function joinSpokenList(items: string[], maxItems = 4): string {
  const limited = items.slice(0, Math.max(1, maxItems));
  if (limited.length === 0) return '';
  if (limited.length === 1) return limited[0];
  return `${limited.slice(0, -1).join(', ')} y ${limited[limited.length - 1]}`;
}

/** "16 de septiembre de 2026, 09:30" en la zona indicada (para correos). */
export function formatLongDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Mapa estable para el panel: id de estado → etiqueta + si ocupa cupo. */
export function statusCatalog(): Array<{ value: string; label: string; occupiesCalendar: boolean }> {
  return Object.keys(STATUS_LABELS).map((value) => ({
    value,
    label: STATUS_LABELS[value],
    occupiesCalendar: occupiesCalendar(value),
  }));
}
