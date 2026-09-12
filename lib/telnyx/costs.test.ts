import { describe, it, expect } from 'vitest';
import { estimateCallCosts, getVoiceRates, round2 } from './costs';

describe('estimateCallCosts — costos reales Telnyx → Upway', () => {
  it('calcula costo Telnyx y facturado Upway por minutos', () => {
    const { telnyxPerMin, upwayPerMin } = getVoiceRates();
    const result = estimateCallCosts(10);
    expect(result.durationMinutes).toBe(10);
    expect(result.telnyxCost).toBe(round2(10 * telnyxPerMin));
    expect(result.upwayBilledCost).toBe(round2(10 * upwayPerMin));
  });

  it('tolera nulos y negativos como 0 (sin costo fantasma)', () => {
    expect(estimateCallCosts(null)).toMatchObject({ durationMinutes: 0, telnyxCost: 0, upwayBilledCost: 0 });
    expect(estimateCallCosts(-5)).toMatchObject({ durationMinutes: 0, telnyxCost: 0, upwayBilledCost: 0 });
  });

  it('redondea a 2 decimales para LlamadaLog', () => {
    const result = estimateCallCosts(1.333);
    expect(result.telnyxCost).toBe(round2(1.333 * getVoiceRates().telnyxPerMin));
  });
});
