/**
 * Planes Upway Health — que vendemos y a que precio (tarifa final sep-2026).
 *
 * ALCANCE REAL (lo que se entrega, sin promesas clinicas):
 * 1. Atiende: contesta la llamada 24/7, sigue el guion que la sede define y agenda.
 * 2. Confirma: toma el dato con catalogo cerrado y lo confirma digito a digito con
 *    el paciente (Res. 866/2021). Es el modulo Identidad Conforme.
 * 3. Audita: grabacion, log de eventos y evidencia de integridad (hash) del registro.
 * NO se vende: criterio clinico autonomo (las reglas de triaje son el protocolo que la
 * sede define y el agente solo lo sigue), HCE ni integracion profunda de HIS.
 * (Ver REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md secciones 0 y 4.5.)
 *
 * COSTO REAL ALL-IN verificado (CO inbound + AI):
 * - Voz CO $0.065 + AI ~$0.0575 = ~$0.1225 USD/min (~$379 COP a TRM 3,090)
 * - Numero CO: $13.50 USD/mes (~$41,715 COP)
 * - Overage cliente: tarifa unica $0.2233 USD/min = $690 COP (45.1% de margen)
 *
 * MARGENES DE LA TARIFA FINAL (sin contar el modulo de identidad):
 * - A uso completo (100% de los minutos incluidos): 37.3% / 36.1% / 34.6% / 32.3%
 * - A utilizacion de planeacion (55%, la que se usa para cubrir costo fijo): 61-62%
 *   y YA NO CAE con el tamano del cliente (antes caia de 78% a 47%).
 *
 * REGLAS (lib/pricing/rules.ts, verificadas en lib/pricing/rules.test.ts):
 * - El escalon incremental de cada plan cuesta menos por minuto que el overage:
 *   subir de plan siempre es mas barato que quedarse abajo pagando overage.
 * - EPS/IPS de mas de 60k min: solo cotizacion (deal desk), nunca por debajo de
 *   $550 COP/min all-in (30% de margen).
 */
import { COP_PER_USD_DEFAULT } from '@/lib/telnyx/costs';
import {
  COST_PER_MIN_COP,
  COST_PER_NUMBER_COP,
  OVERAGE_COP,
} from '@/lib/pricing/rules';

// Re-export para los consumidores historicos (Health y superficies de UI).
export { COST_PER_MIN_COP, COST_PER_NUMBER_COP };

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

/** Matematica del plan a uso completo (100% de los minutos incluidos). */
export function planMath(monthlyCOP: number, minutes: number, numbers: number) {
  const voiceCostCOP = Math.round(minutes * COST_PER_MIN_COP);
  const numbersCostCOP = Math.round(numbers * COST_PER_NUMBER_COP);
  const totalCostCOP = voiceCostCOP + numbersCostCOP;
  const grossProfitCOP = monthlyCOP - totalCostCOP;
  const marginPct = monthlyCOP > 0 ? Math.round((grossProfitCOP / monthlyCOP) * 100) : 0;
  return { voiceCostCOP, numbersCostCOP, totalCostCOP, grossProfitCOP, marginPct };
}

/** Tarifa unica de minuto adicional (overage) para todos los planes de Health. */
export const DEFAULT_OVERAGE_COP = OVERAGE_COP;

/**
 * IVA Colombia 19%.
 * Los precios de los planes son expresados SIN IVA (base gravable); el total facturado
 * al cliente se calcula sobre la base: `withIVA(base) = base + ivaDe(base)`.
 * El IVA es un traslado a DIAN: no afecta el margen de Upway.
 */
export const IVA_RATE = 0.19;
export const ivaDe = (baseCOP: number) => Math.round(baseCOP * IVA_RATE);
export const withIVA = (baseCOP: number) => baseCOP + ivaDe(baseCOP);

// ─────────────────────────────────────────────────────────────────────────────
// MODULO IDENTIDAD CONFORME (Res. 866 de 2021)
//
// Captura guiada por voz con catalogo cerrado, confirmacion digito a digito y
// evidencia de integridad (hash) del registro. Es software puro: no escala con
// los minutos, por eso es la linea que sostiene el margen cuando el cliente
// crece (el margen de voz a uso completo baja de 37.3% a 32.3% al subir de plan).
//
// Se cobra por sede y mes, sin IVA, como adicional al plan base.
// ─────────────────────────────────────────────────────────────────────────────
export const IDENTITY_MODULE_COP = 290000;
/**
 * Precio FINAL por sede y mes (+ IVA). No es descuento de lanzamiento.
 * Es software puro (margen cercano al 100%), y por eso es la linea que sostiene
 * el margen blended cuando el cliente crece. Se revisa solo por (a) IPC acumulado
 * o (b) cambios del catalogo / anexo tecnico de MinSalud que obliguen a re-certificar.
 * KPI comercial: % de cuentas con el modulo activo (meta >70% a 6 meses).
 */
export const IDENTITY_MODULE_ID = 'identidad-conforme';
export const IDENTITY_MODULE_LABEL = 'Identidad conforme (Res. 866/2021)';
export const IDENTITY_MODULE_DESCRIPTION =
  'El agente pide el documento con catalogo cerrado, lo confirma digito a digito con el paciente y entrega el registro con evidencia de integridad.';

export type PlanQuote = {
  baseCOP: number;
  identityModuleCOP: number;
  totalCOP: number;
  ivaCOP: number;
  totalConIvaCOP: number;
};

/**
 * Cotizacion de un plan, con o sin el modulo de identidad conforme.
 * Punto unico de calculo: las pantallas y los contratos usan esto en vez de
 * sumar precios a mano.
 */
export function planQuote(
  monthlyBaseCOP: number,
  options?: { withIdentityModule?: boolean }
): PlanQuote {
  const baseCOP = Math.max(0, Math.round(monthlyBaseCOP));
  const identityModuleCOP = options?.withIdentityModule ? IDENTITY_MODULE_COP : 0;
  const totalCOP = baseCOP + identityModuleCOP;
  return {
    baseCOP,
    identityModuleCOP,
    totalCOP,
    ivaCOP: ivaDe(totalCOP),
    totalConIvaCOP: withIVA(totalCOP),
  };
}

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
    tagline: 'Para empezar: no pierdas una llamada ni un dato.',
    monthlyCOP: 429000,
    setupCOP: 390000,
    includedMinutes: 600,
    includedNumbers: 1,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 2,
    requiresTelnyxApproval: false,
    recordingRetention: '90 dias',
    features: [
      '1 numero dedicado CO',
      '600 min/mes de atencion 24/7',
      'Toma y confirmacion de datos del paciente (catalogo cerrado)',
      'Registro auditable: grabacion 90 dias + log de evidencia',
      'Minuto adicional $690 COP (sin cortes)',
      'Configuracion de sede incluida en la implementacion unica',
    ],
    bestFor: 'Consultorios que pierden pacientes por no contestar.',
    autoActivatable: true,
  },
  {
    id: 'clinica-pro-1800',
    name: 'Clinica Pro',
    target: ['clinica', 'centro-medico'],
    tagline: 'El caballo de batalla 24/7, sin desarrollo clinico.',
    monthlyCOP: 1199000,
    setupCOP: 690000, // configuracion de sede: guion + catalogo de datos + pruebas
    includedMinutes: 1800,
    includedNumbers: 2,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 5,
    requiresTelnyxApproval: false,
    recordingRetention: '1 año',
    features: [
      '2 numeros dedicados',
      '1,800 min/mes de atencion 24/7',
      'Conmutador + toma y confirmacion del dato conforme',
      'Grabacion 1 año + log auditable',
      'Minuto adicional $690 COP',
      'Configuracion de sede (guion + catalogo + pruebas)',
    ],
    bestFor: 'Clinicas que quieren dejar de perder picos.',
    autoActivatable: true,
  },
  {
    id: 'ips-plus-8000',
    name: 'IPS Plus',
    target: ['ips'],
    tagline: 'Volumen medio con el dato confirmado y exportable.',
    monthlyCOP: 4890000,
    setupCOP: 1290000,
    includedMinutes: 8000,
    includedNumbers: 4,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 20,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '4 numeros dedicados',
      '8,000 min/mes + minuto adicional $690 COP',
      'Hasta 20 simultaneas (capacidad ampliada)',
      'Export del dato conforme: API, webhook o CSV',
      'SLA + auditoria de llamadas',
      'Configuracion de sede Upway',
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
  { key: 'integrationMode', label: 'Como consumira el dato (API/webhook/manual)', required: false },
  { key: 'hisSystem', label: 'HIS/HCE actual', required: false },
] as const;

/**
 * Como consumira el HIS/HCE del cliente el dato conforme. Catalogo cerrado:
 * define el trabajo de implementacion antes de firmar, no despues.
 */
export const INTEGRATION_MODE_OPTIONS = [
  { id: 'api-pull', label: 'API (su sistema consulta a Upway)' },
  { id: 'webhook-push', label: 'Webhook (Upway empuja a su sistema)' },
  { id: 'csv-manual', label: 'Export manual (sin integracion tecnica)' },
  { id: 'no-definido', label: 'Aun no lo definimos' },
] as const;

export type IntegrationMode = (typeof INTEGRATION_MODE_OPTIONS)[number]['id'];

export function isImplementationIntakeReady(data: Record<string, unknown>): boolean {
  const required = IMPLEMENTATION_INTAKE_FIELDS.filter((f) => f.required);
  return required.every((f) => {
    const v = data[f.key];
    if (typeof v === 'number') return Number.isFinite(v) && v > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return Boolean(v);
  });
}
