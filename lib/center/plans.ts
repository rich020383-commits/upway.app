/**
 * Upway Center — planes, alcance y economia del contact center AI-first.
 *
 * POSICIONAMIENTO (v2, sep-2026): Upway no le vende software a los call centers:
 * **es el contact center**. Sophie v2 atiende la llamada, resuelve el tier-1 y escala
 * con contexto; la agenda, el CRM/tickets, la grabacion y la evidencia son nuestras.
 *
 * SOLO DOS LINEAS DE SERVICIO (lo demas no se vende):
 * 1. Atencion al cliente (inbound): identifica al cliente, responde el estado, registra
 *    el caso y agenda lo que corresponda.
 * 2. Soporte tecnico N1: recibe la falla, aplica el arbol de diagnostico que el cliente
 *    definio (protocolo cerrado), valida datos del equipo y AGENDA la visita tecnica.
 *
 * FUERA DE ALCANCE (a proposito): outbound comercial o publicitario (requiere consultar
 * el RNE de la CRC — Ley 2300 de 2023 "Dejen de Fregar"), cobranza, ventas con cierre,
 * tier-2/tier-3, y cualquier decision medica, legal o financiera.
 *
 * COSTO Y TARIFA: mismo motor que Health e Inmobiliarias (lib/pricing/rules.ts, reglas
 * R0-R7) y la MISMA tarifa de minuto adicional ($690 COP). El $/min del bundle baja con
 * el volumen y el escalon siempre cuesta menos que el overage.
 *
 * MARGENES (uso completo / utilizacion de planeacion 55%):
 * 699/min -> 39.8% / 64.2%    |  650/min -> 37.4% / 63.6%
 * 624/min -> 35.9% / 63.2%    |  600/min -> 34.6% / 63.0%
 */
import { COP_PER_USD_DEFAULT } from '@/lib/telnyx/costs';
import {
  COST_PER_MIN_COP,
  COST_PER_NUMBER_COP,
  HUMAN_TIER1_BILLABLE_USD_HOUR,
  OVERAGE_COP,
} from '@/lib/pricing/rules';

// Re-export: el overage de Center es la misma tarifa unica de Upway.
export { COST_PER_MIN_COP, COST_PER_NUMBER_COP };

export type CenterServiceLine = 'atencion-cliente' | 'soporte-tecnico';

export type CenterServiceLineDefinition = {
  id: CenterServiceLine;
  label: string;
  /** Que resuelve la IA en tier-1. */
  includes: string[];
  /** Lo que el agente NO hace (guardarrail). */
  excludes: string[];
  /** Que necesita la operacion para arrancar. */
  requires: string[];
  /** AHT de referencia para la cuenta por contacto. */
  referenceAhtMinutes: number;
};

export const CENTER_SERVICE_LINES: readonly CenterServiceLineDefinition[] = [
  {
    id: 'atencion-cliente',
    label: 'Atencion al cliente',
    includes: [
      'Identifica al cliente y valida el dato minimo acordado',
      'Responde estado de pedido, servicio o garantia desde el sistema del cliente',
      'Registra el caso con el catalogo de motivos que el cliente define',
      'Agenda devolucion, recogida o llamada de seguimiento sobre agenda real',
      'Escala con contexto cuando el caso sale del protocolo',
    ],
    excludes: [
      'No promete resultados ni compensaciones (no autoriza descuentos)',
      'No decide garantias: aplica el criterio que el cliente definio',
      'No atiende cobranza ni contacto comercial',
    ],
    requires: [
      'Catalogo cerrado de motivos y de datos a capturar',
      'Acceso de solo lectura al estado (API, webhook o CSV) o carga manual',
      'A quien escalar y con que prioridad',
    ],
    referenceAhtMinutes: 5,
  },
  {
    id: 'soporte-tecnico',
    label: 'Soporte tecnico N1',
    includes: [
      'Recibe la falla y aplica el arbol de diagnostico definido por el cliente',
      'Valida datos del equipo/servicio (serie, modelo, contrato, direccion)',
      'Agenda la visita tecnica sobre la agenda real y confirma la cita por llamada',
      'Entrega link de seguimiento y contexto al tecnico',
      'Escala fallas criticas con el contexto completo (sin diagnostico propio)',
    ],
    excludes: [
      'No diagnostica fuera del arbol definido por el cliente',
      'No cotiza reparaciones ni decide si aplica garantia tecnica',
      'No reemplaza al tier-2/tier-3 humano',
    ],
    requires: [
      'Arbol de diagnostico en formato cerrado (decision del cliente)',
      'Agenda de tecnicos y cobertura por zona',
      'Umbral de criticidad para escalar de inmediato',
    ],
    referenceAhtMinutes: 7,
  },
] as const;

export function getServiceLine(id: string | null | undefined) {
  if (!id) return null;
  return CENTER_SERVICE_LINES.find((line) => line.id === id) ?? null;
}

export type CenterPlan = {
  id: string;
  name: string;
  serviceLine: CenterServiceLine;
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
  autoActivatable: boolean;
};

/** Tarifa unica de minuto adicional: la misma de Health e Inmobiliarias. */
export const DEFAULT_OVERAGE_COP = OVERAGE_COP;

export const CENTER_PLANS: CenterPlan[] = [
  {
    id: 'linea-1000',
    name: 'Linea',
    serviceLine: 'atencion-cliente',
    tagline: 'Un canal de atencion que no deja timbrar en el vacio.',
    monthlyCOP: 699000,
    setupCOP: 490000,
    includedMinutes: 1000,
    includedNumbers: 1,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 2,
    requiresTelnyxApproval: false,
    recordingRetention: '90 dias',
    features: [
      '1 numero dedicado CO',
      '1.000 min/mes de atencion 24/7',
      'Identificacion del cliente y captura de datos con catalogo cerrado',
      'Registro auditable: grabacion 90 dias + log por llamada',
      'Minuto adicional $690 COP (sin cortes)',
      'Configuracion inicial de la operacion',
    ],
    bestFor: 'Negocio con una linea de atencion atendida hoy por 1-2 personas.',
    autoActivatable: true,
  },
  {
    id: 'atencion-3000',
    name: 'Atencion',
    serviceLine: 'atencion-cliente',
    tagline: 'Atencion al cliente con los sistemas del cliente conectados.',
    monthlyCOP: 1949000,
    setupCOP: 990000,
    includedMinutes: 3000,
    includedNumbers: 2,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 6,
    requiresTelnyxApproval: false,
    recordingRetention: '1 año',
    features: [
      '2 numeros dedicados',
      '3.000 min/mes de atencion 24/7',
      'Estado de pedido/servicio/garantia desde su sistema (API, webhook o CSV)',
      'Ticket por caso con catalogo de motivos propio',
      'Agenda de recogidas, devoluciones o llamadas de seguimiento',
      'Grabacion 1 año + log auditable',
    ],
    bestFor: 'Operacion con 3-8 personas en atencion y sin SLA propio.',
    autoActivatable: true,
  },
  {
    id: 'soporte-8000',
    name: 'Soporte',
    serviceLine: 'soporte-tecnico',
    tagline: 'Recibe la falla, diagnostica con tu protocolo y agenda la visita.',
    monthlyCOP: 4990000,
    setupCOP: 1890000,
    includedMinutes: 8000,
    includedNumbers: 4,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 16,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '4 numeros dedicados',
      '8.000 min/mes de soporte tecnico N1',
      'Arbol de diagnostico cerrado (lo define el cliente)',
      'Agenda de visitas tecnicas por zona + confirmacion de cita por llamada',
      'Link de seguimiento con contexto para el tecnico',
      'Escalamiento de fallas criticas con contexto completo',
    ],
    bestFor: 'Empresas con servicio tecnico de campo o soporte de producto.',
    autoActivatable: true,
  },
  {
    id: 'operacion-25000',
    name: 'Operacion 24/7',
    serviceLine: 'soporte-tecnico',
    tagline: 'Multi-linea, multi-sede y SLA: la operacion completa.',
    monthlyCOP: 14990000,
    setupCOP: 3400000,
    includedMinutes: 25000,
    includedNumbers: 8,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 40,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '8 numeros dedicados',
      '25.000 min/mes + minuto adicional $690 COP',
      'Hasta 40 llamadas simultaneas (capacidad ampliada)',
      'SLA de disponibilidad y reporte mensual de operacion',
      'Tablero por sede/linea y export de casos (API/webhook/CSV)',
      'Implementacion multi-sede acompanada',
    ],
    bestFor: 'Redes, multi-sede y operaciones con picos estacionales.',
    autoActivatable: true,
  },
  {
    id: 'empresa-custom',
    name: 'Empresa (Custom)',
    serviceLine: 'soporte-tecnico',
    tagline: '60k-200k min: cotizacion por volumen (deal desk).',
    monthlyCOP: 0,
    setupCOP: 0,
    includedMinutes: 60000,
    includedNumbers: 10,
    overageCOP: 0,
    concurrentCalls: 100,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año (a confirmar)',
    features: [
      'Piso de cotizacion: costo / (1 - 0.30) — nunca por debajo de $550 COP/min',
      'Incluye la misma tarifa unica de minuto adicional para volumen extra',
      'Simultaneidad >40 exige ampliar capacidad del proveedor antes de firmar',
      'No auto-activar: deal desk + cotizacion',
    ],
    bestFor: 'Operaciones grandes fuera de la escalera estandar.',
    autoActivatable: false,
  },
];

export const STANDARD_CENTER_PLANS = CENTER_PLANS.filter((plan) => plan.monthlyCOP > 0);
export const ALL_CENTER_PLANS = CENTER_PLANS;

// ─────────────────────────────────────────────────────────────────────────────
// ECONOMIA DEL ESCALAMIENTO HUMANO (el costo que casi nadie modela)
//
// Si prometemos "escala a humano", ese humano cuesta. Con el SMMLV 2026 oficial
// ($1.750.905 + $249.095 de auxilio de transporte) y un perfil de agente de contact
// center (1,3x SMMLV), el costo cargado de la posicion ronda $4,7M/mes incluyendo
// prestaciones, supervision y QA.
//
// Dos numeros que NO son lo mismo:
// - Lo que el cliente paga HOY por un humano: tarifa BPO de mercado ($14 USD/h segun
//   rethinkCX) -> margen 38% si el humano fuera nuestro.
// - Lo que cobrariamos por el gestor humano Upway (piso $12,9 USD/h): margen 33%.
// Contra 55-64% de la IA. Conclusion honesta: el humano es una funcion de conformidad
// (CX), no el motor de margen. Fase 1: escalar al equipo del cliente (costo marginal
// cero para Upway). Fase 2: "gestor humano Upway" con precio publicado y capacidad
// limitada.
// ─────────────────────────────────────────────────────────────────────────────
export const SMMLV_2026_COP = 1_750_905;
export const AUXILIO_TRANSPORTE_2026_COP = 249_095;
/** Perfil de agente de contact center por encima del minimo (no bilingue). */
export const AGENT_SALARY_MULTIPLE_OF_SMMLV = 1.3;
/** Prestaciones + seguridad social + parafiscales. */
export const PAYROLL_BURDEN_PCT = 0.55;
/** Team lead, QA, WFM y tecnologia por posicion. */
export const SUPERVISION_OVERHEAD_PCT = 0.2;
export const HOURS_PER_MONTH = 176;
/** Ocupacion tipica de un asesor humano (habla 24 de cada 60 minutos). */
export const DEFAULT_OCCUPANCY = 0.4;
/** Piso de facturacion del gestor humano Upway (USD/hora). */
export const HUMAN_GESTOR_MIN_BILLABLE_USD_HOUR = 12.9;
export type HumanAgentEconomics = {
  monthlySalaryCOP: number;
  monthlyBaseCOP: number;
  monthlyLoadedCOP: number;
  monthlyWithOverheadCOP: number;
  costPerHourCOP: number;
  costPerHourUSD: number;
  billablePerHourCOP: number;
  billablePerHourUSD: number;
  marginPct: number;
  /** Nuestro costo por minuto realmente hablado (con ociosidad incluida). */
  costPerTalkMinuteCOP: number;
  /** Lo que paga el cliente por minuto hablado a tarifa facturable. */
  billablePerTalkMinuteCOP: number;
};

export function humanAgentEconomics(options?: {
  trm?: number;
  occupancy?: number;
  billableUSDPerHour?: number;
}): HumanAgentEconomics {
  const trm = options?.trm ?? COP_PER_USD_DEFAULT;
  const occupancy = options?.occupancy ?? DEFAULT_OCCUPANCY;
  const billableUSDPerHour = options?.billableUSDPerHour ?? HUMAN_TIER1_BILLABLE_USD_HOUR;

  const monthlySalaryCOP = Math.round(SMMLV_2026_COP * AGENT_SALARY_MULTIPLE_OF_SMMLV);
  const monthlyBaseCOP = monthlySalaryCOP + AUXILIO_TRANSPORTE_2026_COP;
  const monthlyLoadedCOP = Math.round(monthlyBaseCOP * (1 + PAYROLL_BURDEN_PCT));
  const monthlyWithOverheadCOP = Math.round(monthlyLoadedCOP * (1 + SUPERVISION_OVERHEAD_PCT));
  const costPerHourCOP = Math.round(monthlyWithOverheadCOP / HOURS_PER_MONTH);
  const billablePerHourCOP = Math.round(billableUSDPerHour * trm);
  const safeOccupancy = occupancy > 0 ? occupancy : DEFAULT_OCCUPANCY;

  return {
    monthlySalaryCOP,
    monthlyBaseCOP,
    monthlyLoadedCOP,
    monthlyWithOverheadCOP,
    costPerHourCOP,
    costPerHourUSD: Math.round((costPerHourCOP / trm) * 100) / 100,
    billablePerHourCOP,
    billablePerHourUSD: billableUSDPerHour,
    marginPct: billablePerHourCOP > 0 ? ((billablePerHourCOP - costPerHourCOP) / billablePerHourCOP) * 100 : 0,
    costPerTalkMinuteCOP: Math.round(costPerHourCOP / 60 / safeOccupancy),
    billablePerTalkMinuteCOP: Math.round(billablePerHourCOP / 60 / safeOccupancy),
  };
}

/** $/min implicito del plan (lo que paga el cliente por minuto incluido). */
export function planPerMinuteCOP(plan: CenterPlan): number {
  return plan.includedMinutes > 0 ? plan.monthlyCOP / plan.includedMinutes : 0;
}

function referenceAhtMinutes(plan: CenterPlan): number {
  return getServiceLine(plan.serviceLine)?.referenceAhtMinutes ?? 5;
}

/** Lo que cuesta UN contacto resuelto con el plan (AHT de referencia de la linea). */
export function contactCostAtPlanCOP(plan: CenterPlan, ahtMinutes?: number): number {
  const aht = ahtMinutes ?? referenceAhtMinutes(plan);
  return Math.round(planPerMinuteCOP(plan) * aht);
}

/** Nuestro costo de un contacto si el humano fuera nuestro (ocupacion real incluida). */
export function humanContactCostCOP(
  ahtMinutes: number,
  economics: HumanAgentEconomics = humanAgentEconomics()
): number {
  return Math.round(economics.costPerTalkMinuteCOP * ahtMinutes);
}

/** Lo que el cliente paga hoy por ese contacto a tarifa facturable (ocupacion real). */
export function humanContactBillableCOP(
  ahtMinutes: number,
  economics: HumanAgentEconomics = humanAgentEconomics()
): number {
  return Math.round(economics.billablePerTalkMinuteCOP * ahtMinutes);
}

/**
 * Ahorro del contacto atendido por Upway contra el contacto humano facturable.
 * OJO: se calcula con la ocupacion REAL (40%). A 100% de ocupacion el humano se
 * acerca y el argumento deja de ser precio: pasa a ser concurrencia + 24/7.
 */
export function contactSavingsVsHumanPct(plan: CenterPlan, ahtMinutes?: number): number {
  const aht = ahtMinutes ?? referenceAhtMinutes(plan);
  const human = humanContactBillableCOP(aht);
  if (human <= 0) return 0;
  return ((human - contactCostAtPlanCOP(plan, aht)) / human) * 100;
}
