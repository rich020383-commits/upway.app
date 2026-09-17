import { describe, expect, it } from 'vitest';
import {
  dateKeyInTimeZone,
  dayOfWeekFromDateKey,
  mergeWindows,
  minutesFromMidnightInTimeZone,
  minutesToTimeLabel,
  normalizeDateKey,
  overlaps,
  resolveAvailability,
  resolveAvailabilityRange,
  subtractWindows,
  timeLabelToMinutes,
  timeZoneOffsetMinutes,
  toBusyBlock,
  zonedDateTimeToUtc,
  type AvailabilityRuleInput,
} from '@/lib/agenda/availability';

const BOGOTA = 'America/Bogota';
const MONDAY = '2026-09-21'; // lunes
const SUNDAY = '2026-09-20';

function mondayRule(overrides: Partial<AvailabilityRuleInput> = {}): AvailabilityRuleInput {
  return {
    resourceId: 'res-1',
    dayOfWeek: 1,
    startMinute: 9 * 60,
    endMinute: 11 * 60,
    ...overrides,
  };
}

describe('agenda/availability · etiquetas de hora', () => {
  it('convierte HH:MM a minutos y viceversa', () => {
    expect(timeLabelToMinutes('09:30')).toBe(570);
    expect(timeLabelToMinutes('00:00')).toBe(0);
    expect(minutesToTimeLabel(570)).toBe('09:30');
    expect(minutesToTimeLabel(0)).toBe('00:00');
    expect(minutesToTimeLabel(1500)).toBe('01:00');
  });

  it('rechaza horas inválidas en vez de inventar un valor', () => {
    expect(() => timeLabelToMinutes('9:60')).toThrow(/rango/i);
    expect(() => timeLabelToMinutes('abc')).toThrow(/inválida/i);
  });
});

describe('agenda/availability · fechas y zona horaria', () => {
  it('calcula el día de la semana sin desfase de zona', () => {
    expect(dayOfWeekFromDateKey('2026-09-16')).toBe(3); // miércoles
    expect(dayOfWeekFromDateKey(MONDAY)).toBe(1);
    expect(dayOfWeekFromDateKey(SUNDAY)).toBe(0);
  });

  it('normaliza fechas en Date o string', () => {
    expect(normalizeDateKey('2026-09-16')).toBe('2026-09-16');
    expect(normalizeDateKey(new Date('2026-09-16T12:00:00.000Z'))).toBe('2026-09-16');
  });

  it('respeta la zona horaria de la clínica', () => {
    expect(timeZoneOffsetMinutes(new Date('2026-09-21T14:00:00.000Z'), BOGOTA)).toBe(-300);
    expect(minutesFromMidnightInTimeZone(new Date('2026-09-21T14:30:00.000Z'), BOGOTA)).toBe(570);
    // 02:00 UTC del 16 = 21:00 del 15 en Bogotá
    expect(dateKeyInTimeZone(new Date('2026-09-16T02:00:00.000Z'), BOGOTA)).toBe('2026-09-15');
  });

  it('convierte hora local de pared a instante UTC', () => {
    expect(zonedDateTimeToUtc(MONDAY, 9 * 60, BOGOTA).toISOString()).toBe('2026-09-21T14:00:00.000Z');
    expect(zonedDateTimeToUtc(MONDAY, 0, BOGOTA).toISOString()).toBe('2026-09-21T05:00:00.000Z');
  });
});

describe('agenda/availability · ventanas', () => {
  it('une ventanas solapadas o contiguas', () => {
    expect(
      mergeWindows([
        { startMinute: 600, endMinute: 660 },
        { startMinute: 640, endMinute: 720 },
        { startMinute: 780, endMinute: 840 },
      ])
    ).toEqual([
      { startMinute: 600, endMinute: 720 },
      { startMinute: 780, endMinute: 840 },
    ]);
  });

  it('resta un bloque (almuerzo) partiendo la ventana en dos', () => {
    expect(
      subtractWindows([{ startMinute: 540, endMinute: 720 }], [{ startMinute: 600, endMinute: 660 }])
    ).toEqual([
      { startMinute: 540, endMinute: 600 },
      { startMinute: 660, endMinute: 720 },
    ]);
  });

  it('detecta solapes de bloques', () => {
    const a = toBusyBlock(new Date('2026-09-21T14:00:00.000Z'), new Date('2026-09-21T14:30:00.000Z'));
    const b = toBusyBlock(new Date('2026-09-21T14:30:00.000Z'), new Date('2026-09-21T15:00:00.000Z'));
    expect(overlaps(a, b)).toBe(false);
    const c = toBusyBlock(new Date('2026-09-21T14:29:00.000Z'), new Date('2026-09-21T15:00:00.000Z'));
    expect(overlaps(a, c)).toBe(true);
  });
});

describe('agenda/availability · generación de cupos', () => {
  it('genera cupos dentro de la ventana según el paso', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
    });

    expect(result.status).toBe('open');
    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(result.slots[0].start.toISOString()).toBe('2026-09-21T14:00:00.000Z');
    expect(result.slots[0].endLabel).toBe('09:30');
  });

  it('cierra el día cuando no hay reglas para ese día', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule({ dayOfWeek: 2 })],
      durationMinutes: 30,
    });

    expect(result.status).toBe('closed');
    expect(result.slots).toEqual([]);
  });

  it('bloquea los cupos ocupados por citas existentes', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      appointments: [
        toBusyBlock(
          new Date('2026-09-21T14:20:00.000Z'), // 09:20 local
          new Date('2026-09-21T14:50:00.000Z') // 09:50 local
        ),
      ],
    });

    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['10:00', '10:30']);
    expect(result.blockedBy.conflicts).toBe(2);
  });

  it('bloquea los cupos apartados por un hold del agente de voz', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 60,
      holds: [toBusyBlock(new Date('2026-09-21T14:00:00.000Z'), new Date('2026-09-21T14:30:00.000Z'))],
    });

    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['10:00']);
  });

  it('aplica el buffer previo al elegir cupo', () => {
    const appointment = [
      toBusyBlock(new Date('2026-09-21T14:00:00.000Z'), new Date('2026-09-21T14:30:00.000Z')),
    ];

    const sinBuffer = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      appointments: appointment,
    });

    const conBuffer = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      bufferBeforeMinutes: 30,
      appointments: appointment,
    });

    expect(sinBuffer.slots.map((slot) => slot.startLabel)).toEqual(['09:30', '10:00', '10:30']);
    expect(conBuffer.slots.map((slot) => slot.startLabel)).toEqual(['10:00', '10:30']);
  });

  it('respeta la anticipación mínima', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      minLeadTimeMinutes: 30,
      now: new Date('2026-09-21T14:00:00.000Z'), // 09:00 local: el cupo de 09:00 ya no es agendable
    });

    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['09:30', '10:00', '10:30']);
    expect(result.blockedBy.leadTime).toBe(1);
  });

  it('deja el día sin cupos si la anticipación mínima cubre toda la ventana', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      minLeadTimeMinutes: 120,
      now: new Date('2026-09-21T14:00:00.000Z'), // 09:00 local + 2h = 11:00 local (fin de ventana)
    });

    expect(result.slots).toEqual([]);
    expect(result.blockedBy.leadTime).toBe(4);
  });

  it('rechaza duraciones inválidas', () => {
    expect(() =>
      resolveAvailability({
        dateKey: MONDAY,
        timeZone: BOGOTA,
        rules: [mondayRule()],
        durationMinutes: 0,
      })
    ).toThrow(/duración/i);
  });
});

describe('agenda/availability · excepciones', () => {
  it('cierra todo el día con un festivo', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      exceptions: [{ resourceId: 'res-1', date: MONDAY, kind: 'HOLIDAY', allDay: true }],
    });

    expect(result.status).toBe('closed');
    expect(result.windows).toEqual([]);
  });

  it('cierra todo el día con un time-off de día completo', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      exceptions: [{ resourceId: 'res-1', date: MONDAY, kind: 'TIME_OFF', allDay: true }],
    });

    expect(result.slots).toEqual([]);
  });

  it('recorta la ventana con un time-off parcial', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 30,
      exceptions: [
        {
          resourceId: 'res-1',
          date: MONDAY,
          kind: 'TIME_OFF',
          allDay: false,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
        },
      ],
    });

    expect(result.windows).toEqual([{ startMinute: 600, endMinute: 660 }]);
    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['10:00', '10:30']);
  });

  it('abre un día extra (domingo de jornada especial)', () => {
    const result = resolveAvailability({
      dateKey: SUNDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 60,
      exceptions: [
        {
          resourceId: 'res-1',
          date: SUNDAY,
          kind: 'EXTRA_OPENING',
          allDay: false,
          startMinute: 8 * 60,
          endMinute: 10 * 60,
        },
      ],
    });

    expect(result.status).toBe('open');
    expect(result.slots.map((slot) => slot.startLabel)).toEqual(['08:00', '09:00']);
  });

  it('ignora excepciones de otro recurso cuando se filtra por recurso', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      resourceId: 'res-1',
      exceptions: [{ resourceId: 'res-2', date: MONDAY, kind: 'HOLIDAY', allDay: true }],
    });

    expect(result.status).toBe('open');
  });

  it('solo considera las reglas del recurso pedido', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule({ resourceId: 'res-2' })],
      durationMinutes: 30,
      resourceId: 'res-1',
    });

    expect(result.status).toBe('closed');
  });

  it('respeta validFrom/validTo de la regla', () => {
    const result = resolveAvailability({
      dateKey: MONDAY,
      timeZone: BOGOTA,
      rules: [mondayRule({ validFrom: '2026-10-01' })],
      durationMinutes: 30,
    });

    expect(result.status).toBe('closed');
  });
});

describe('agenda/availability · rango de días', () => {
  it('resuelve varios días seguidos y deja vacíos los días sin reglas', () => {
    const days = resolveAvailabilityRange({
      fromDateKey: '2026-09-19', // sábado
      days: 3,
      timeZone: BOGOTA,
      rules: [mondayRule()],
      durationMinutes: 30,
      slotStepMinutes: 60,
    });

    expect(days).toHaveLength(3);
    expect(days.map((day) => day.dateKey)).toEqual(['2026-09-19', '2026-09-20', '2026-09-21']);
    expect(days.map((day) => day.slots.length)).toEqual([0, 0, 2]);
  });
});
