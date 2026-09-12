/**
 * Planes Upway Health — honestos, competitivos y con margen.
 *
 * COSTO REAL ALL-IN verificado (CO inbound + AI):
 * - Voz CO $0.065 + AI ~$0.0575 = ~$0.1225 USD/min (~$379 COP a TRM 3,090)
 * - Numero CO: $13.50 USD/mes (~$41,715 COP)
 * - Concurrency default del proveedor de voz: 2 (mas requiere ampliar capacidad)
 * - Overage cliente (base): $0.177 USD/min = $547 COP
 *
 * Margenes objetivo al incluir minutos (sin overage):
 * - Consultorio 600 → ~64%
 * - Clinica Pro 1800 → ~61%
 * - IPS Plus 8000 → ~49%
 * - IPS Enterprise 25000 → ~38%
 * - EPS/Custom → cotizar; no precio fijo sin ampliar capacidad del proveedor
 */
import {
  COP_PER_USD_DEFAULT,
  TELNYX_COST_PER_MIN_DEFAULT,
  TELNYX_NUMBER_MRC_USD_DEFAULT,
  UPWAY_PRICE_PER_MIN_DEFAULT,
} from '@/lib/telnyx/costs';

export type FacilityType = 'consultorio' | 'centro-medico' | 'clinica' | 'ips' | 'eps';

export type HealthPlan = {
  id: string;
  name: string;
  target: FacilityType[];
  tagline: string;
  monthlyCOP: number;
  setupCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  overageCOP: number;
  concurrentCalls: number;
  requiresTelnyxApproval: boolean;
  recordingRetention: string;
  features: string[];
  bestFor: string;
  /** Si false, no se puede auto-activar: cotizacion + ampliar capacidad del proveedor. */
  autoActivatable: boolean;
};

export const FACILITY_TYPE_OPTIONS: { id: FacilityType; label: string; hint: string }[] = [
  { id: 'consultorio', label: 'Consultorio', hint: '1-2 profesionales, volumen bajo' },
  { id: 'centro-medico', label: 'Centro medico', hint: 'Varias especialidades, volumen medio' },
  { id: 'clinica', label: 'Clinica', hint: 'Atencion continua, picos diarios' },
  { id: 'ips', label: 'IPS', hint: 'Alto volumen, multi-linea, SLA' },
  { id: 'eps', label: 'EPS / Red', hint: 'Muy alto volumen — solo custom' },
];

export const cop = (usd: number, trm = COP_PER_USD_DEFAULT) => Math.round(usd * trm);

export function planMath(monthlyCOP: number, minutes: number, numbers: number) {
  const voiceCostCOP = Math.round(minutes * TELNYX_COST_PER_MIN_DEFAULT * COP_PER_USD_DEFAULT);
  const numbersCostCOP = Math.round(numbers * TELNYX_NUMBER_MRC_USD_DEFAULT * COP_PER_USD_DEFAULT);
  const totalCostCOP = voiceCostCOP + numbersCostCOP;
  const grossProfitCOP = monthlyCOP - totalCostCOP;
  const marginPct = monthlyCOP > 0 ? Math.round((grossProfitCOP / monthlyCOP) * 100) : 0;
  return { voiceCostCOP, numbersCostCOP, totalCostCOP, grossProfitCOP, marginPct };
}

/** Costo all-in de un minuto para Upway (no el precio al cliente). */
export const COST_PER_MIN_COP = cop(TELNYX_COST_PER_MIN_DEFAULT);
export const DEFAULT_OVERAGE_COP = cop(UPWAY_PRICE_PER_MIN_DEFAULT);
export const COST_PER_NUMBER_COP = cop(TELNYX_NUMBER_MRC_USD_DEFAULT);

/**
 * IVA Colombia 19%.
 * Los precios de los planes son expresados SIN IVA (base gravable); el total facturado
 * al cliente se calcula sobre la base: `withIVA(base) = base + ivaDe(base)`.
 * El IVA es un traslado a DIAN: no afecta el margen de Upway.
 */
export const IVA_RATE = 0.19;
export const ivaDe = (baseCOP: number) => Math.round(baseCOP * IVA_RATE);
export const withIVA = (baseCOP: number) => baseCOP + ivaDe(baseCOP);

/**
* MODELO PREPAGO (RECARGA) - el dinero del cliente paga su propio consumo.
* El cliente carga la recarga del mes por adelantado. De esa recarga se reserva
* el costo Telnyx EXACTO (minutos incluidos + numeros dedicados) y el resto es
* margen que retiramos de inmediato (dividendo). Nunca financiamos el consumo.
*/
export type RecargaBreakdown = {
  recargaCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  minutesCostCOP: number;
  numbersCostCOP: number;
  telnyxReserveCOP: number;
  marginCOP: number;
  marginPct: number;
  coversCost: boolean;
};

export function recargaBreakdown(recargaCOP: number, includedMinutes: number, includedNumbers: number): RecargaBreakdown {
  const minutesCostCOP = Math.round(includedMinutes * COST_PER_MIN_COP);
  const numbersCostCOP = Math.round(includedNumbers * COST_PER_NUMBER_COP);
  const telnyxReserveCOP = minutesCostCOP + numbersCostCOP;
  const marginCOP = recargaCOP - telnyxReserveCOP;
  return {
    recargaCOP,
    includedMinutes,
    includedNumbers,
    minutesCostCOP,
    numbersCostCOP,
    telnyxReserveCOP,
    marginCOP,
    marginPct: recargaCOP > 0 ? Math.round((marginCOP / recargaCOP) * 100) : 0,
    coversCost: marginCOP >= 0,
  };
}

export type RecargaSimulation = {
  recargaCOP: number;
  usedMinutes: number;
  overageMinutes: number;
  telnyxCostUsedCOP: number;
  remainingCOP: number;
  needsTopUpCOP: number;
};

export function simulateRecarga(recargaCOP: number, includedMinutes: number, includedNumbers: number, usedMinutes: number): RecargaSimulation {
  const total = Math.max(0, usedMinutes);
  const overageMinutes = Math.max(0, total - includedMinutes);
  const telnyxCostUsedCOP = Math.round(total * COST_PER_MIN_COP) + Math.round(includedNumbers * COST_PER_NUMBER_COP);
  const remainingCOP = recargaCOP - telnyxCostUsedCOP;
  return {
    recargaCOP,
    usedMinutes: total,
    overageMinutes,
    telnyxCostUsedCOP,
    remainingCOP,
    needsTopUpCOP: remainingCOP < 0 ? Math.abs(remainingCOP) : 0,
  };
}

export const HEALTH_PLANS: HealthPlan[] = [
  {
    id: 'consultorio-600',
    name: 'Consultorio',
    target: ['consultorio', 'centro-medico'],
    tagline: 'Para empezar: nunca pierdas una cita.',
    monthlyCOP: 769000,
    setupCOP: 590000,
    includedMinutes: 600,
    includedNumbers: 1,
    overageCOP: 750,
    concurrentCalls: 2,
    requiresTelnyxApproval: false,
    recordingRetention: '90 dias',
    features: [
      '1 numero dedicado CO',
      '600 min/mes voz full AI',
      'WhatsApp + agenda + recordatorios',
      'Panel /health real',
      'Minuto adicional $750 COP',
      'Implementacion white-glove Upway',
    ],
    bestFor: 'Consultorios que pierden citas por no contestar.',
    autoActivatable: true,
  },
  {
    id: 'clinica-pro-1800',
    name: 'Clinica Pro',
    target: ['clinica', 'centro-medico'],
    tagline: 'El caballo de batalla 24/7.',
    monthlyCOP: 1914000,
    setupCOP: 890000,
    includedMinutes: 1800,
    includedNumbers: 2,
    overageCOP: 750,
    concurrentCalls: 5,
    requiresTelnyxApproval: false,
    recordingRetention: '1 año',
    features: [
      '2 numeros dedicados',
      '1,800 min/mes',
      'Triaje + escalamiento + FAQs',
      'Grabacion 1 año',
      'Minuto adicional $750 COP',
      'Implementacion white-glove Upway',
    ],
    bestFor: 'Clinicas que quieren dejar de perder picos.',
    autoActivatable: true,
  },
  {
    id: 'ips-plus-8000',
    name: 'IPS Plus',
    target: ['ips'],
    tagline: 'Volumen medio con overage que protege el margen.',
    monthlyCOP: 7109000,
    setupCOP: 1900000,
    includedMinutes: 8000,
    includedNumbers: 4,
    overageCOP: 700,
    concurrentCalls: 20,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '4 numeros dedicados',
      '8,000 min/mes + overage $700 COP',
      'Hasta 20 simultaneas (capacidad ampliada)',
      'SLA + auditoria de llamadas',
      'White-glove incluido',
    ],
    bestFor: 'IPS medianas sin contratar agentes extra.',
    autoActivatable: true,
  },
];

/** Que debe capturar el onboarding para que Upway pueda implementar. */
export const IMPLEMENTATION_INTAKE_FIELDS = [
  { key: 'facilityType', label: 'Tipo de sede', required: true },
  { key: 'legalName', label: 'Razon social', required: true },
  { key: 'nit', label: 'NIT', required: true },
  { key: 'contactName', label: 'Contacto operativo', required: true },
  { key: 'contactPhone', label: 'Celular del contacto', required: true },
  { key: 'contactEmail', label: 'Email del contacto', required: true },
  { key: 'dailyCalls', label: 'Llamadas/dia estimadas', required: true },
  { key: 'avgCallMinutes', label: 'Duracion media (min)', required: true },
  { key: 'planId', label: 'Plan elegido', required: true },
  { key: 'preferredAreaCode', label: 'Indicativo preferido (opcional)', required: false },
  { key: 'existingPhone', label: 'Numero actual a portar (opcional)', required: false },
  { key: 'crmOrAgenda', label: 'Agenda/CRM actual', required: false },
] as const;

export function isImplementationIntakeReady(data: Record<string, unknown>): boolean {
  const required = IMPLEMENTATION_INTAKE_FIELDS.filter((f) => f.required);
  return required.every((f) => {
    const v = data[f.key];
    if (typeof v === 'number') return Number.isFinite(v) && v > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return Boolean(v);
  });
}
