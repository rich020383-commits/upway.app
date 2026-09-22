/**
 * Planes Upway para Inmobiliarias — tarifa final (sep-2026).
 *
 * Usa el MISMO motor de precios que Health (lib/pricing/rules.ts): el minuto de voz
 * cuesta lo mismo en las dos verticales, asi que la escalera cumple las mismas reglas
 * R0-R7. Lo unico que no aplica aqui es el modulo de Identidad Conforme (la Res. 866
 * de 2021 es de salud): en inmobiliaria el dato que se confirma es el del interesado
 * (operacion, zona, presupuesto, urgencia) y la trazabilidad es la misma.
 *
 * COSTO REAL ALL-IN verificado (CO inbound + AI), compartido con Health:
 * - Voz CO $0.065 + AI ~$0.0575 = ~$0.1225 USD/min (~$379 COP a TRM 3.090)
 * - Numero CO: $13.50 USD/mes (~$41.715 COP)
 * - Minuto adicional: tarifa unica $690 COP (45.1% de margen)
 *
 * QUE ESTABA MAL (auditoria sep-2026):
 * - Starter 600 min $399.000 ($665/min) y Profesional 1.500 min $999.000 ($666/min):
 *   el mismo precio por minuto: cero descuento por volumen.
 * - Sucursal 4.000 min $2.499.000 ($625/min) contra un overage de $547/min: comprar
 *   "Profesional + 2.500 min de overage" costaba $2.366.500, asi que el plan grande
 *   nacia dominado: nadie racional lo compraba.
 * - Plan Red con margen de 20% a uso completo (por debajo del piso de 30%).
 *
 * MARGENES DE LA TARIFA FINAL:
 * - A uso completo (100% de los minutos incluidos): 32.6% / 32.0% / 33.3% / 32.1%
 * - A utilizacion de planeacion (55%): 58-61%, y no cae con el tamano del cliente.
 */
import { COP_PER_USD_DEFAULT } from '@/lib/telnyx/costs';
import { COST_PER_MIN_COP, COST_PER_NUMBER_COP, OVERAGE_COP } from '@/lib/pricing/rules';

// Re-export para los consumidores historicos (landing de precios de inmobiliarias).
export { COST_PER_MIN_COP, COST_PER_NUMBER_COP };

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

/** Tarifa unica de minuto adicional para inmobiliarias. */
export const DEFAULT_OVERAGE_COP = OVERAGE_COP;

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
      'Voz IA 24/7: atiende, confirma los datos y agenda',
      'Agenda sobre tu calendario',
      'Calificación configurable de leads',
      'Grabación y trazabilidad auditable por llamada',
      'Integración CRM (Webhooks)',
    ],
    bestFor: 'Agentes independientes y oficinas pequeñas con volumen bajo.',
  },
  {
    id: 'profesional-1500',
    name: 'Profesional',
    target: ['sucursal'],
    tagline: 'Escala tu atención con calificación avanzada de leads.',
    monthlyCOP: 959000,
    setupCOP: 190000,
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
    monthlyCOP: 2459000,
    setupCOP: 390000,
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
    monthlyCOP: 5890000,
    setupCOP: 690000,
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
