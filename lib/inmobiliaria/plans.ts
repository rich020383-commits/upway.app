/**
 * Planes Upway para Inmobiliarias — honestos, competitivos y con margen.
 *
 * COSTO REAL ALL-IN verificado (CO inbound + AI), compartido con Health:
 * - Voz CO $0.065 + AI ~$0.0575 = $0.1225 USD/min (~$379 COP a TRM 3.090)
 * - Numero CO: $13.50 USD/mes (~$41.715 COP)
 * - Overage cliente: $0.177 USD/min = ~$547 COP
 *
 * Para inmobiliaria NO aplica el módulo de identidad conforme (Res. 866/2021
 * es exclusivo de salud). Los precios se derivan directamente del costo all-in,
 * con márgenes consistentes a los de Health, y redondeados a múltiplos amigables.
 *
 * Margen objetivo (sin overage, base mensual):
 * - Starter 600  → ~64%
 * - Profesional 1500 → ~62%
 * - Sucursal 4000 → ~56%
 * - Red 10000 → ~50%
 */
import {
  COP_PER_USD_DEFAULT,
  TELNYX_COST_PER_MIN_DEFAULT,
  TELNYX_NUMBER_MRC_USD_DEFAULT,
  UPWAY_PRICE_PER_MIN_DEFAULT,
} from '@/lib/telnyx/costs';

export type BusinessSize = 'un-oficina' | 'sucursal' | 'red' | 'franquicia';

export type InmobiliariaPlan = {
  id: string;
  name: string;
  target: BusinessSize[];
  tagline: string;
  monthlyCOP: number;
  setupCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  overageCOP: number;
  concurrentCalls: number;
  features: string[];
  bestFor: string;
};

export const cop = (usd: number, trm = COP_PER_USD_DEFAULT) => Math.round(usd * trm);

/** Costo all-in de un minuto para Upway en COP. */
export const COST_PER_MIN_COP = cop(TELNYX_COST_PER_MIN_DEFAULT);
export const DEFAULT_OVERAGE_COP = cop(UPWAY_PRICE_PER_MIN_DEFAULT);
export const COST_PER_NUMBER_COP = cop(TELNYX_NUMBER_MRC_USD_DEFAULT);

export const IVA_RATE = 0.19;
export const ivaDe = (baseCOP: number) => Math.round(baseCOP * IVA_RATE);
export const withIVA = (baseCOP: number) => baseCOP + ivaDe(baseCOP);

export type PlanQuote = {
  baseCOP: number;
  totalCOP: number;
  ivaCOP: number;
  totalConIvaCOP: number;
};

export function planQuote(monthlyBaseCOP: number): PlanQuote {
  const baseCOP = Math.max(0, Math.round(monthlyBaseCOP));
  return {
    baseCOP,
    totalCOP: baseCOP,
    ivaCOP: ivaDe(baseCOP),
    totalConIvaCOP: withIVA(baseCOP),
  };
}

export const INMOBILIARIA_PLANS: readonly InmobiliariaPlan[] = [
  {
    id: 'starter-600',
    name: 'Starter',
    target: ['un-oficina'],
    tagline: 'Agenda inteligente para un agente o equipo pequeño.',
    monthlyCOP: 399000,
    setupCOP: 0,
    includedMinutes: 600,
    includedNumbers: 1,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 2,
    features: [
      'Voz IA 24/7 con identificación de interesado',
      'Agenda sobre tu calendario',
      'Calificación configurable de leads',
      'Grabación y auditoría',
      'Integración CRM (Webhooks)',
    ],
    bestFor: 'Agentes independientes y oficinas pequeñas con volumen bajo.',
  },
  {
    id: 'profesional-1500',
    name: 'Profesional',
    target: ['sucursal'],
    tagline: 'Escala tu atención con calificación avanzada de leads.',
    monthlyCOP: 999000,
    setupCOP: 0,
    includedMinutes: 1500,
    includedNumbers: 2,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 4,
    features: [
      'Todo lo de Starter',
      'Calificación avanzada (presupuesto, urgencia, zona)',
      'Seguimiento automático a leads inactivos',
      'Números simultáneos',
      'Reportes de rendimiento',
    ],
    bestFor: 'Oficinas o sucursales con múltiples agentes.',
  },
  {
    id: 'sucursal-4000',
    name: 'Sucursal',
    target: ['sucursal', 'red'],
    tagline: 'Operación completa para equipos medianos y multi-sucursal.',
    monthlyCOP: 2499000,
    setupCOP: 199000,
    includedMinutes: 4000,
    includedNumbers: 3,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 8,
    features: [
      'Todo lo de Profesional',
      'Routing de llamadas por zona/asesor',
      'Integración CRM bidireccional',
      'API para coordinación de visitas',
      'Soporte dedicado',
    ],
    bestFor: 'Empresas con múltiples oficinas o una sola sucursal con alto volumen.',
  },
  {
    id: 'red-10000',
    name: 'Red',
    target: ['red', 'franquicia'],
    tagline: 'Control total para redes de agentes y franquicias.',
    monthlyCOP: 4999000,
    setupCOP: 499000,
    includedMinutes: 10000,
    includedNumbers: 5,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 16,
    features: [
      'Todo lo de Sucursal',
      'API abierta para integración personalizada',
      'Panel de rendimiento multi-sucursal',
      'Soporte 24/7 con gestión de incidencias',
      'SLA de disponibilidad',
    ],
    bestFor: 'Redes de agentes, franquicias y grandes empresas con requerimientos SLA.',
  },
] as const;

export const STANDARD_INMOB_PLANS = INMOBILIARIA_PLANS.filter((p) => p.monthlyCOP > 0);
export const CUSTOM_INMOB_PLANS = INMOBILIARIA_PLANS.filter((p) => p.monthlyCOP === 0);
