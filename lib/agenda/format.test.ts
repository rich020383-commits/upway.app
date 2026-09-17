import { describe, expect, it } from 'vitest';
import {
  cancelNote,
  channelLabel,
  formatDateKeyLabel,
  formatDateTimeLabel,
  formatLongDateTime,
  formatMinutesRange,
  formatSpokenDateTime,
  humanDuration,
  isTerminalStatus,
  joinSpokenList,
  occupiesCalendar,
  statusCatalog,
  statusLabel,
} from '@/lib/agenda/format';

const BOGOTA = 'America/Bogota';

describe('agenda/format · rangos y duraciones', () => {
  it('formatea el rango de una franja', () => {
    expect(formatMinutesRange(570, 600)).toBe('09:30–10:00');
    expect(formatMinutesRange(0, 60)).toBe('00:00–01:00');
    expect(formatMinutesRange(1380, 1440)).toBe('23:00–00:00');
  });

  it('describe duraciones en lenguaje natural', () => {
    expect(humanDuration(1)).toBe('1 minuto');
    expect(humanDuration(30)).toBe('30 minutos');
    expect(humanDuration(60)).toBe('1 hora');
    expect(humanDuration(90)).toBe('1 hora y 30 minutos');
    expect(humanDuration(120)).toBe('2 horas');
    expect(humanDuration(-5)).toBe('0 minutos');
  });

  it('une listas habladas', () => {
    expect(joinSpokenList([])).toBe('');
    expect(joinSpokenList(['09:00'])).toBe('09:00');
    expect(joinSpokenList(['09:00', '09:30'])).toBe('09:00 y 09:30');
    expect(joinSpokenList(['09:00', '09:30', '10:00'])).toBe('09:00, 09:30 y 10:00');
    expect(joinSpokenList(['a', 'b', 'c', 'd', 'e'], 2)).toBe('a y b');
  });
});

describe('agenda/format · fechas', () => {
  it('nombra el día en español sin desfase de zona', () => {
    const label = formatDateKeyLabel('2026-09-16');
    expect(label).toContain('miércoles');
    expect(label).toContain('16');
    expect(label).toContain('septiembre');
  });

  it('rechaza fechas mal formadas', () => {
    expect(() => formatDateKeyLabel('16/09/2026')).toThrow(/inválida/i);
  });

  it('formatea fecha y hora en la zona del recurso', () => {
    const date = new Date('2026-09-21T14:30:00.000Z'); // 09:30 en Bogotá
    const label = formatDateTimeLabel(date, BOGOTA);
    expect(label).toContain('09:30');
    expect(label).toContain('21');

    const spoken = formatSpokenDateTime(date, BOGOTA);
    expect(spoken).toContain('a las 09:30');
    expect(spoken).toContain('lunes');

    const long = formatLongDateTime(date, BOGOTA);
    expect(long).toContain('09:30');
    expect(long).toContain('2026');
  });
});

describe('agenda/format · estados y canales', () => {
  it('traduce los estados al español', () => {
    expect(statusLabel('PENDING')).toBe('Pendiente de confirmar');
    expect(statusLabel('CONFIRMED')).toBe('Confirmada');
    expect(statusLabel('NO_SHOW')).toBe('No asistió');
    expect(statusLabel('INVENTADO')).toBe('INVENTADO');
  });

  it('distingue estados terminales y ocupación de cupo', () => {
    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('CONFIRMED')).toBe(false);

    expect(occupiesCalendar('CONFIRMED')).toBe(true);
    expect(occupiesCalendar('CHECKED_IN')).toBe(true);
    expect(occupiesCalendar('CANCELLED')).toBe(false);
    expect(occupiesCalendar('NO_SHOW')).toBe(false);
    expect(occupiesCalendar('REBOOKED')).toBe(false);
  });

  it('explica qué pasa con el cupo al cerrar una cita', () => {
    expect(cancelNote('CANCELLED')).toContain('libre');
    expect(cancelNote('CONFIRMED')).toBeNull();
  });

  it('traduce los canales', () => {
    expect(channelLabel('VOICE')).toBe('Llamada');
    expect(channelLabel('DASHBOARD')).toBe('Panel');
    expect(channelLabel('OTRO')).toBe('OTRO');
  });

  it('expone el catálogo de estados para el panel', () => {
    const catalog = statusCatalog();
    expect(catalog).toHaveLength(7);
    expect(catalog.find((item) => item.value === 'CANCELLED')?.occupiesCalendar).toBe(false);
    expect(catalog.find((item) => item.value === 'CONFIRMED')?.occupiesCalendar).toBe(true);
  });
});
