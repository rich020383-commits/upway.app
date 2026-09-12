/**
 * Costos de voz Telnyx - Upway (costos reales persistidos en LlamadaLog).
 * Telnyx es el canal oficial; Vapi solo queda como alias legacy en UI/BD.
 *
 * COSTO REAL ALL-IN verificado (CO inbound + AI):
 * - Voz inbound CO: $0.065 USD/min
 * - AI Assistant: $0.05 + STT $0.003 + TTS ~$0.0035 + LLM ~$0.001 = $0.0575 USD/min
 * - Total: ~$0.1225 USD/min = $379 COP/min (TRM 3,090)
 * - Numeros CO: $13.50 USD/mes c/u = $41,715 COP
 * - Minuto adicional (overage) Upway: $0.177 USD = $547 COP
 *
 * Env overrides: TELNYX_COST_PER_MIN_USD / UPWAY_PRICE_PER_MIN_USD / COP_PER_USD.
 */

export const TELNYX_COST_PER_MIN_DEFAULT = 0.1225;
export const UPWAY_PRICE_PER_MIN_DEFAULT = 0.177;
export const COP_PER_USD_DEFAULT = 3090;
export const TELNYX_NUMBER_MRC_USD_DEFAULT = 13.5;

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
