/**
 * Motor de disponibilidad de la Agenda Premium Upway.
 *
 * 100% propio: calcula cupos a partir de reglas semanales + excepciones
 * − citas existentes − holds activos, en la zona horaria del recurso.
 *
 * Funciones PURAS (sin Prisma, sin red) para poder probarlas y reutilizarlas
 * desde el panel, el agente de voz (Telnyx) y los correos.
 */

export type AgendaExceptionKind = 'TIME_OFF' | 'HOLIDAY' | 'EXTRA_OPENING';

export type TimeWindow = {
  startMinute: number;
  endMinute: number;
};

export type AvailabilityRuleInput = {
  resourceId: string;
  serviceId?: string | null;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  slotStepMinutes?: number | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  isActive?: boolean | null;
};

export type AvailabilityExceptionInput = {
  resourceId: string;
  date: Date | string;
  kind: AgendaExceptionKind;
  allDay?: boolean | null;
  startMinute?: number | null;
  endMinute?: number | null;
};

export type BusyBlock = {
  start: Date;
  end: Date;
};

export type AvailabilitySlot = {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  startMinute: number;
  endMinute: number;
  resourceId: string;
};

const MINUTE_MS = 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

/** "09:30" → 570. Lanza si el formato o el rango no son válidos. */
export function timeLabelToMinutes(label: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!match) throw new Error(`Hora inválida (se espera HH:MM): ${label}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Hora fuera de rango: ${label}`);
  return hours * 60 + minutes;
}

/** 570 → "09:30". Normaliza valores fuera de rango por aritmética modular. */
export function minutesToTimeLabel(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** "2026-09-16" → [2026, 9, 16]. Lanza si no es una fecha ISO simple. */
export function parseDateKey(dateKey: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) throw new Error(`Fecha inválida (se espera YYYY-MM-DD): ${dateKey}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Acepta Date o string y devuelve siempre "YYYY-MM-DD". */
export function normalizeDateKey(value: Date | string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return new Date(trimmed).toISOString().slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado, calculado sin desfase de zona horaria. */
export function dayOfWeekFromDateKey(dateKey: string): number {
  const [year, month, day] = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function partsInTimeZone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Minutos al este de UTC para esa zona en ese instante (Bogotá = -300). */
export function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = partsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - date.getTime()) / MINUTE_MS);
}

/** "YYYY-MM-DD" en la zona horaria indicada (no en UTC del servidor). */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = partsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/** Minutos desde medianoche local de ese instante (para comparar con reglas). */
export function minutesFromMidnightInTimeZone(date: Date, timeZone: string): number {
  const parts = partsInTimeZone(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

/**
 * Convierte "hora local de pared" a instante UTC real.
 * Hace una segunda pasada para resolver los saltos de horario de verano.
 */
export function zonedDateTimeToUtc(dateKey: string, minutesFromMidnight: number, timeZone: string): Date {
  const [year, month, day] = parseDateKey(dateKey);
  const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0) + minutesFromMidnight * MINUTE_MS;
  const firstGuess = new Date(naiveUtc - timeZoneOffsetMinutes(new Date(naiveUtc), timeZone) * MINUTE_MS);
  return new Date(naiveUtc - timeZoneOffsetMinutes(firstGuess, timeZone) * MINUTE_MS);
}

// ---------------------------------------------------------------------------
// Ventanas de atención
// ---------------------------------------------------------------------------

/** Une ventanas solapadas o contiguas y las ordena. */
export function mergeWindows(windows: TimeWindow[]): TimeWindow[] {
  const sorted = windows
    .filter((window) => window.endMinute > window.startMinute)
    .map((window) => ({ ...window }))
    .sort((a, b) => a.startMinute - b.startMinute);

  const merged: TimeWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && window.startMinute <= last.endMinute) {
      last.endMinute = Math.max(last.endMinute, window.endMinute);
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}

/** Resta bloques (almuerzo, time-off parcial) de las ventanas base. */
export function subtractWindows(base: TimeWindow[], cuts: TimeWindow[]): TimeWindow[] {
  let result = base.map((window) => ({ ...window }));

  for (const cut of cuts) {
    const next: TimeWindow[] = [];
    for (const window of result) {
      // Sin solape: la ventana sobrevive intacta.
      if (cut.endMinute <= window.startMinute || cut.startMinute >= window.endMinute) {
        next.push(window);
        continue;
      }
      if (cut.startMinute > window.startMinute) {
        next.push({ startMinute: window.startMinute, endMinute: cut.startMinute });
      }
      if (cut.endMinute < window.endMinute) {
        next.push({ startMinute: cut.endMinute, endMinute: window.endMinute });
      }
    }
    result = next;
  }

  return result
    .filter((window) => window.endMinute > window.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute);
}

export function overlaps(a: BusyBlock, b: BusyBlock): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

export function toBusyBlock(start: Date, end: Date): BusyBlock {
  return { start, end };
}

/** Una regla con vigencia (validFrom/validTo) solo aplica dentro de ese rango. */
export function isRuleValidForDate(rule: AvailabilityRuleInput, dateKey: string): boolean {
  const [year, month, day] = parseDateKey(dateKey);
  const dayTimestamp = Date.UTC(year, month - 1, day);

  if (rule.validFrom) {
    const [fy, fm, fd] = parseDateKey(normalizeDateKey(rule.validFrom));
    if (dayTimestamp < Date.UTC(fy, fm - 1, fd)) return false;
  }
  if (rule.validTo) {
    const [ty, tm, td] = parseDateKey(normalizeDateKey(rule.validTo));
    if (dayTimestamp > Date.UTC(ty, tm - 1, td)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Resolución de cupos
// ---------------------------------------------------------------------------

export type ResolveAvailabilityParams = {
  dateKey: string;
  timeZone: string;
  rules: AvailabilityRuleInput[];
  exceptions?: AvailabilityExceptionInput[];
  /** Citas ya agendadas (los buffers se aplican aquí, no se asumen). */
  appointments?: BusyBlock[];
  /** Holds activos del agente de voz u otros canales. */
  holds?: BusyBlock[];
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  slotStepMinutes?: number;
  /** Anticipación mínima para agendar (ej. no agendar en los próximos 120 min). */
  minLeadTimeMinutes?: number;
  now?: Date;
  /** Si se define, solo se consideran reglas/excepciones de ese recurso. */
  resourceId?: string;
};

export type ResolveAvailabilityResult = {
  dateKey: string;
  timeZone: string;
  dayOfWeek: number;
  windows: TimeWindow[];
  slots: AvailabilitySlot[];
  blockedBy: { conflicts: number; leadTime: number };
  /** "closed" = no hay ventana de atención ese día. */
  status: 'open' | 'closed';
};

export function resolveAvailability(params: ResolveAvailabilityParams): ResolveAvailabilityResult {
  const {
    dateKey,
    timeZone,
    rules,
    exceptions = [],
    appointments = [],
    holds = [],
    durationMinutes,
  } = params;

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error(`Duración inválida para agendar: ${durationMinutes}`);
  }

  const dayOfWeek = dayOfWeekFromDateKey(dateKey);
  const step = Math.max(1, params.slotStepMinutes ?? 15);
  const bufferBefore = Math.max(0, params.bufferBeforeMinutes ?? 0);
  const bufferAfter = Math.max(0, params.bufferAfterMinutes ?? 0);
  const minLeadTime = Math.max(0, params.minLeadTimeMinutes ?? 0);
  const now = params.now ?? new Date();
  const busyBlocks = [...appointments, ...holds];

  const belongsToResource = (resourceId: string) =>
    !params.resourceId || resourceId === params.resourceId;

  const dayRules = rules.filter(
    (rule) =>
      rule &&
      rule.isActive !== false &&
      rule.dayOfWeek === dayOfWeek &&
      rule.startMinute < rule.endMinute &&
      belongsToResource(rule.resourceId) &&
      isRuleValidForDate(rule, dateKey)
  );

  let windows = mergeWindows(
    dayRules.map((rule) => ({ startMinute: rule.startMinute, endMinute: rule.endMinute }))
  );

  const dayExceptions = exceptions.filter(
    (exception) =>
      exception && belongsToResource(exception.resourceId) && normalizeDateKey(exception.date) === dateKey
  );

  const fullDayClosures = dayExceptions.filter(
    (exception) =>
      exception.kind === 'HOLIDAY' || (exception.kind === 'TIME_OFF' && exception.allDay !== false)
  );

  if (fullDayClosures.length > 0) {
    return {
      dateKey,
      timeZone,
      dayOfWeek,
      windows: [],
      slots: [],
      blockedBy: { conflicts: 0, leadTime: 0 },
      status: 'closed',
    };
  }

  const partialCuts = dayExceptions
    .filter(
      (exception) =>
        exception.kind === 'TIME_OFF' &&
        exception.allDay === false &&
        exception.startMinute != null &&
        exception.endMinute != null
    )
    .map((exception) => ({
      startMinute: exception.startMinute as number,
      endMinute: exception.endMinute as number,
    }));

  if (partialCuts.length > 0) {
    windows = subtractWindows(windows, partialCuts);
  }

  const extraOpenings = dayExceptions
    .filter((exception) => exception.kind === 'EXTRA_OPENING')
    .map((exception) =>
      exception.allDay !== false
        ? { startMinute: 0, endMinute: MINUTES_PER_DAY }
        : { startMinute: exception.startMinute ?? 0, endMinute: exception.endMinute ?? 0 }
    )
    .filter((window) => window.endMinute > window.startMinute);

  if (extraOpenings.length > 0) {
    windows = mergeWindows([...windows, ...extraOpenings]);
  }

  return resolveSlotsInWindows({
    dateKey,
    timeZone,
    dayOfWeek,
    windows,
    step,
    durationMinutes,
    bufferBefore,
    bufferAfter,
    minLeadTime,
    now,
    busyBlocks,
    resourceId: params.resourceId ?? '',
  });
}

type ResolveSlotsInput = {
  dateKey: string;
  timeZone: string;
  dayOfWeek: number;
  windows: TimeWindow[];
  step: number;
  durationMinutes: number;
  bufferBefore: number;
  bufferAfter: number;
  minLeadTime: number;
  now: Date;
  busyBlocks: BusyBlock[];
  resourceId: string;
};

/**
 * Genera los cupos dentro de las ventanas ya calculadas.
 * Un cupo se descarta si su bloque (con buffers) choca con una cita/hold
 * o si no cumple la anticipación mínima.
 */
function resolveSlotsInWindows(input: ResolveSlotsInput): ResolveAvailabilityResult {
  const {
    dateKey,
    timeZone,
    dayOfWeek,
    windows,
    step,
    durationMinutes,
    bufferBefore,
    bufferAfter,
    minLeadTime,
    now,
    busyBlocks,
    resourceId,
  } = input;

  const blockedBy = { conflicts: 0, leadTime: 0 };
  const slots: AvailabilitySlot[] = [];
  const seen = new Set<number>();

  for (const window of windows) {
    const lastStart = window.endMinute - durationMinutes;

    for (let startMinute = window.startMinute; startMinute <= lastStart; startMinute += step) {
      const start = zonedDateTimeToUtc(dateKey, startMinute, timeZone);
      const end = zonedDateTimeToUtc(dateKey, startMinute + durationMinutes, timeZone);
      const occupied: BusyBlock = {
        start: new Date(start.getTime() - bufferBefore * MINUTE_MS),
        end: new Date(end.getTime() + bufferAfter * MINUTE_MS),
      };

      if (busyBlocks.some((busy) => overlaps(occupied, busy))) {
        blockedBy.conflicts += 1;
        continue;
      }

      if (minLeadTime > 0 && start.getTime() - now.getTime() < minLeadTime * MINUTE_MS) {
        blockedBy.leadTime += 1;
        continue;
      }

      if (seen.has(start.getTime())) continue;
      seen.add(start.getTime());

      slots.push({
        start,
        end,
        startLabel: minutesToTimeLabel(startMinute),
        endLabel: minutesToTimeLabel(startMinute + durationMinutes),
        startMinute,
        endMinute: startMinute + durationMinutes,
        resourceId,
      });
    }
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());

  return {
    dateKey,
    timeZone,
    dayOfWeek,
    windows,
    slots,
    blockedBy,
    status: windows.length > 0 ? 'open' : 'closed',
  };
}

/** Resuelve varios días seguidos (para "próximos cupos disponibles"). */
export function resolveAvailabilityRange(
  params: Omit<ResolveAvailabilityParams, 'dateKey'> & { fromDateKey: string; days: number }
): ResolveAvailabilityResult[] {
  const { fromDateKey, days, ...rest } = params;
  const [year, month, day] = parseDateKey(fromDateKey);
  const results: ResolveAvailabilityResult[] = [];

  for (let offset = 0; offset < Math.max(1, days); offset += 1) {
    const cursor = new Date(Date.UTC(year, month - 1, day + offset));
    const monthKey = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const dayKey = String(cursor.getUTCDate()).padStart(2, '0');
    const dateKey = `${cursor.getUTCFullYear()}-${monthKey}-${dayKey}`;
    results.push(resolveAvailability({ ...rest, dateKey }));
  }

  return results;
}
