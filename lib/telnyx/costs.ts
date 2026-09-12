/**
 * Costos de voz Telnyx → Upway (costos reales persistidos en LlamadaLog).
 * Telnyx es el canal oficial; Vapi solo queda como alias legacy en UI/BD.
 *
 * Modelo simple y auditable:
 * - TELNYX_COST_PER_MIN: lo que Telnyx le cobra a Upway (Call Control + AI).
 * - UPWAY_PRICE_PER_MIN: lo que Upway le factura a la tienda (con margen).
 * Env overrides: TELNYX_COST_PER_MIN_USD / UPWAY_PRICE_PER_MIN_USD.
 */

export const TELNYX_COST_PER_MIN_DEFAULT = 0.02;
export const UPWAY_PRICE_PER_MIN_DEFAULT = 0.05;

function toNumber(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getVoiceRates() {
  return {
    telnyxPerMin: toNumber(process.env.TELNYX_COST_PER_MIN_USD, TELNYX_COST_PER_MIN_DEFAULT),
    upwayPerMin: toNumber(process.env.UPWAY_PRICE_PER_MIN_USD, UPWAY_PRICE_PER_MIN_DEFAULT),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function estimateCallCosts(durationMinutes: number | null | undefined) {
  const mins = Math.max(0, Number(durationMinutes ?? 0) || 0);
  const { telnyxPerMin, upwayPerMin } = getVoiceRates();
  return {
    durationMinutes: Math.round(mins * 100) / 100,
    telnyxCost: round2(mins * telnyxPerMin),
    upwayBilledCost: round2(mins * upwayPerMin),
  };
}
