/**
 * Reglas de precio Upway — una sola fuente de verdad para voz (Health e Inmobiliarias).
 *
 * POR QUE EXISTE ESTE MODULO (auditoria sep-2026):
 *
 * 1. Los planes estaban anclados a una promesa de "insercion en el desarrollo
 *    clinico" (triaje clinico, integracion profunda de HIS, white-glove de 4h)
 *    que Upway NO entrega. Ver REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md:
 *    Upway solo juega donde el dato nace (identidad y admision) y en lo
 *    administrativo que depende de ese dato. Hoy vendemos tres cosas concretas:
 *    atiende la llamada, confirma el dato conforme (Res. 866/2021) y deja
 *    evidencia auditable. El precio debe reflejar ESO, no lo otro.
 *
 * 2. Los planes grandes estaban DOMINADOS por el plan chico + overage:
 *      Consultorio 600 = $769.000 (overage $750) y Clinica Pro 1.800 = $1.914.000.
 *      Tomar Consultorio + 1.200 min de overage costaba $1.669.000 < $1.914.000.
 *      Un cliente racional nunca compraba Clinica Pro, IPS Plus ni Enterprise.
 *    El mismo error, peor, en inmobiliarias: overage $547 y Sucursal a
 *    $2.499.000/4.000 min -> "Profesional + 2.500 min de overage" = $2.366.500.
 *
 * REGLAS VIGENTES (verificadas por auditTariff en lib/pricing/rules.test.ts):
 *
 *  R0  Valor: ningun $/min de Upway (planes ni overage) supera el minuto humano
 *      facturado ($14 USD/h ÷ 60 = $721 COP) — y la IA ademas concurre y cubre 24/7.
 *  R1  Overage con margen >= 40% sobre el costo all-in ($379 COP/min).
 *  R2  Overage unico por vertical: misma tarifa en todos los planes (no hay
 *      minuto de primera y minuto de segunda).
 *  R3  El escalon incremental de cada plan cuesta al menos 5% menos por minuto
 *      que el overage. Si no, el plan de arriba queda dominado (arbitraje).
 *  R4  Margen a uso completo (100% de los minutos incluidos) >= 30%.
 *  R5  Margen a utilizacion de planeacion (55%) >= 55% y sin caer con el tamano
 *      del cliente (deriva maxima 3 puntos).
 *  R6  $/min implicito decreciente: a mas volumen, menos $/min.
 *  R7  Precios cerrados (multiplos de 1.000 COP) para poder decirlos en voz alta.
 *
 * Las reglas no son decorativas: auditTariff devuelve hallazgos y el test falla
 * si alguien vuelve a invertir la escalera. El reporte humano vive en
 * scripts/precios-reporte.mjs (npm run precios).
 */
import {
  COP_PER_USD_DEFAULT,
  TELNYX_COST_PER_MIN_DEFAULT,
  TELNYX_NUMBER_MRC_USD_DEFAULT,
  UPWAY_PRICE_PER_MIN_DEFAULT,
} from '@/lib/telnyx/costs';

/** TRM de referencia (COP/USD). Una sola TRM para todo el pricing. */
export const TRM_COP_PER_USD = COP_PER_USD_DEFAULT;

/** Costo all-in de un minuto de voz para Upway (Telnyx + AI). No es precio al cliente. */
export const COST_PER_MIN_COP = Math.round(TELNYX_COST_PER_MIN_DEFAULT * TRM_COP_PER_USD);

/** Costo mensual de un numero dedicado CO. */
export const COST_PER_NUMBER_COP = Math.round(TELNYX_NUMBER_MRC_USD_DEFAULT * TRM_COP_PER_USD);

/** Tarifa final del minuto adicional (overage) Upway. */
export const OVERAGE_COP = Math.round(UPWAY_PRICE_PER_MIN_DEFAULT * TRM_COP_PER_USD);

/** Utilizacion de planeacion: el bundle se vende ~1,8x el uso real tipico. */
export const PLANNING_UTILIZATION = 0.55;

export const OVERAGE_MIN_MARGIN_PCT = 40;
export const PLAN_MIN_MARGIN_FULL_PCT = 30;
export const PLAN_MIN_MARGIN_PLANNING_PCT = 55;
export const PLANNING_MARGIN_DRIFT_MAX_PCT = 3;
/** El escalon de subida de plan debe ser <= 95% del overage (minimo 5% de ahorro). */
export const MAX_STEP_RATE_VS_OVERAGE = 0.95;
/** Piso absoluto de cotizacion para volumen custom (deal desk): nunca por debajo. */
export const DEAL_DESK_FLOOR_PER_MIN_COP = 550;
export const PRICE_ROUNDING_COP = 1_000;

/** Tarifa billable Tier-1 Colombia (rethinkCX BPO Cost Index): USD/hora. */
export const HUMAN_TIER1_BILLABLE_USD_HOUR = 14;
/** Minuto humano facturado en COP: $14/h ÷ 60 × TRM. */
export const HUMAN_BILLABLE_MIN_COP = Math.round((HUMAN_TIER1_BILLABLE_USD_HOUR / 60) * TRM_COP_PER_USD);

export type TariffPlan = {
  id: string;
  name: string;
  monthlyCOP: number;
  setupCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  /** 0 = a cotizar (deal desk / no auto-activable). */
  overageCOP: number;
};

export const roundPct = (value: number) => Math.round(value * 10) / 10;

export function monthlyCostCOP(minutes: number, numbers: number): number {
  const mins = Math.max(0, Number(minutes) || 0);
  const nums = Math.max(0, Number(numbers) || 0);
  return Math.round(mins * COST_PER_MIN_COP + nums * COST_PER_NUMBER_COP);
}

export type PlanEconomics = {
  planId: string;
  name: string;
  monthlyCOP: number;
  /** Costo asumiendo que el cliente consume el 100% de los minutos incluidos. */
  costFullCOP: number;
  marginFullPct: number;
  /** Costo asumiendo PLANNING_UTILIZATION del bundle (escenario de planeacion). */
  costPlanningCOP: number;
  marginPlanningPct: number;
  /** $/min implicito del bundle. */
  effectivePerMinuteCOP: number;
  /** Margen del minuto adicional del plan. */
  overageMarginPct: number | null;
  /** Utilidad marginal por minuto adicional. */
  overageProfitPerMinCOP: number | null;
};

export function planEconomics(plan: TariffPlan, utilization = PLANNING_UTILIZATION): PlanEconomics {
  const costFullCOP = monthlyCostCOP(plan.includedMinutes, plan.includedNumbers);
  const costPlanningCOP = Math.round(
    plan.includedMinutes * utilization * COST_PER_MIN_COP + plan.includedNumbers * COST_PER_NUMBER_COP
  );
  const overageMarginPct =
    plan.overageCOP > 0 ? ((plan.overageCOP - COST_PER_MIN_COP) / plan.overageCOP) * 100 : null;
  return {
    planId: plan.id,
    name: plan.name,
    monthlyCOP: plan.monthlyCOP,
    costFullCOP,
    marginFullPct: plan.monthlyCOP > 0 ? ((plan.monthlyCOP - costFullCOP) / plan.monthlyCOP) * 100 : 0,
    costPlanningCOP,
    marginPlanningPct:
      plan.monthlyCOP > 0 ? ((plan.monthlyCOP - costPlanningCOP) / plan.monthlyCOP) * 100 : 0,
    effectivePerMinuteCOP: plan.includedMinutes > 0 ? plan.monthlyCOP / plan.includedMinutes : 0,
    overageMarginPct,
    overageProfitPerMinCOP: plan.overageCOP > 0 ? plan.overageCOP - COST_PER_MIN_COP : null,
  };
}

export function overageMarginPct(overageCOP = OVERAGE_COP): number {
  return ((overageCOP - COST_PER_MIN_COP) / overageCOP) * 100;
}

/** $/min que el cliente realmente paga por cada minuto extra al subir de plan. */
export function stepRateCOP(previous: TariffPlan, next: TariffPlan): number {
  const extraMinutes = next.includedMinutes - previous.includedMinutes;
  if (extraMinutes <= 0) return Number.POSITIVE_INFINITY;
  return (next.monthlyCOP - previous.monthlyCOP) / extraMinutes;
}

/**
 * Punto de cruce: a partir de cuantos minutos el plan `next` cuesta menos que
 * quedarse en `previous` pagando overage. Es el umbral honesto de recomendacion.
 */
export function crossoverMinutes(
  previous: TariffPlan,
  next: TariffPlan,
  overageCOP = OVERAGE_COP
): number {
  return previous.includedMinutes + (next.monthlyCOP - previous.monthlyCOP) / overageCOP;
}

export type TariffChoice = {
  plan: TariffPlan;
  totalCOP: number;
  overageMinutes: number;
};

/**
 * La forma mas barata de consumir `minutes`: el plan mas pequeno (compromiso
 * minimo) si el volumen no llega, o cualquier plan + overage si el volumen lo
 * supera. Punto unico de verdad para recomendar sin sobrevender.
 */
export function cheapestTariffForMinutes(
  plans: readonly TariffPlan[],
  minutes: number,
  overageCOP = OVERAGE_COP
): TariffChoice | null {
  const paid = plans
    .filter((plan) => plan.monthlyCOP > 0)
    .slice()
    .sort((a, b) => a.includedMinutes - b.includedMinutes);
  if (paid.length === 0) return null;

  const target = Math.max(0, Number(minutes) || 0);
  let best: TariffChoice | null = null;
  for (const plan of paid) {
    const overageMinutes = Math.max(0, target - plan.includedMinutes);
    const totalCOP = plan.monthlyCOP + overageMinutes * overageCOP;
    if (!best || totalCOP < best.totalCOP) best = { plan, totalCOP, overageMinutes };
  }
  return best;
}

export type TariffFindingCode =
  | 'OVERAGE_UNIFORME'
  | 'OVERAGE_MARGEN'
  | 'PLAN_MARGEN_USO_COMPLETO'
  | 'PLAN_MARGEN_PLANEACION'
  | 'MARGEN_CAE_CON_TAMANO'
  | 'ESCALON_MAS_CARO_QUE_OVERAGE'
  | 'NO_DECRECE_POR_MINUTO'
  | 'MINUTO_SOBRE_HUMANO'
  | 'REDONDEO';

export type TariffFinding = {
  code: TariffFindingCode;
  planId: string;
  detail: string;
};

/**
 * Auditoria de una escalera completa de precios. Devuelve [] cuando la tarifa
 * cumple R0-R7. Es puro: sirve para Health, Inmobiliarias o cualquier vertical
 * futuro sin tocar nada mas.
 */
export function auditTariff(
  plans: readonly TariffPlan[],
  overageCOP = OVERAGE_COP
): TariffFinding[] {
  const findings: TariffFinding[] = [];
  const paid = plans
    .filter((plan) => plan.monthlyCOP > 0)
    .slice()
    .sort((a, b) => a.includedMinutes - b.includedMinutes);

  if (paid.length > 0) {
    const margin = overageMarginPct(overageCOP);
    if (margin < OVERAGE_MIN_MARGIN_PCT) {
      findings.push({
        code: 'OVERAGE_MARGEN',
        planId: 'overage',
        detail: `${overageCOP} COP/min deja ${roundPct(margin)}% (minimo ${OVERAGE_MIN_MARGIN_PCT}%).`,
      });
    }
    if (overageCOP > HUMAN_BILLABLE_MIN_COP) {
      findings.push({
        code: 'MINUTO_SOBRE_HUMANO',
        planId: 'overage',
        detail: `${overageCOP} COP/min supera el minuto humano facturado (${HUMAN_BILLABLE_MIN_COP} COP).`,
      });
    }
  }

  const marginPlanningOfEntry = paid.length > 0 ? planEconomics(paid[0]).marginPlanningPct : 0;

  paid.forEach((plan, index) => {
    const economics = planEconomics(plan);
    const previous = index > 0 ? paid[index - 1] : null;

    if (plan.overageCOP !== overageCOP) {
      findings.push({
        code: 'OVERAGE_UNIFORME',
        planId: plan.id,
        detail: `Overage ${plan.overageCOP} distinto de la tarifa unica ${overageCOP}.`,
      });
    }

    if (economics.marginFullPct < PLAN_MIN_MARGIN_FULL_PCT) {
      findings.push({
        code: 'PLAN_MARGEN_USO_COMPLETO',
        planId: plan.id,
        detail: `${roundPct(economics.marginFullPct)}% a uso completo (minimo ${PLAN_MIN_MARGIN_FULL_PCT}%).`,
      });
    }

    if (economics.marginPlanningPct < PLAN_MIN_MARGIN_PLANNING_PCT) {
      findings.push({
        code: 'PLAN_MARGEN_PLANEACION',
        planId: plan.id,
        detail: `${roundPct(economics.marginPlanningPct)}% a ${PLANNING_UTILIZATION * 100}% de uso (minimo ${PLAN_MIN_MARGIN_PLANNING_PCT}%).`,
      });
    }

    if (marginPlanningOfEntry - economics.marginPlanningPct > PLANNING_MARGIN_DRIFT_MAX_PCT) {
      findings.push({
        code: 'MARGEN_CAE_CON_TAMANO',
        planId: plan.id,
        detail: `El margen de planeacion cae ${roundPct(marginPlanningOfEntry - economics.marginPlanningPct)} puntos vs el plan de entrada.`,
      });
    }

    if (economics.effectivePerMinuteCOP > HUMAN_BILLABLE_MIN_COP) {
      findings.push({
        code: 'MINUTO_SOBRE_HUMANO',
        planId: plan.id,
        detail: `$${Math.round(economics.effectivePerMinuteCOP)}/min implicito supera el minuto humano ($${HUMAN_BILLABLE_MIN_COP}).`,
      });
    }

    if (plan.monthlyCOP % PRICE_ROUNDING_COP !== 0 || plan.setupCOP % PRICE_ROUNDING_COP !== 0) {
      findings.push({
        code: 'REDONDEO',
        planId: plan.id,
        detail: `Precios no multiplos de ${PRICE_ROUNDING_COP} (mensual ${plan.monthlyCOP}, setup ${plan.setupCOP}).`,
      });
    }

    if (previous) {
      const step = stepRateCOP(previous, plan);
      const ceiling = overageCOP * MAX_STEP_RATE_VS_OVERAGE;
      if (step > ceiling) {
        findings.push({
          code: 'ESCALON_MAS_CARO_QUE_OVERAGE',
          planId: plan.id,
          detail: `Escalon $${Math.round(step)}/min vs overage $${overageCOP} (techo $${Math.round(ceiling)}): ${previous.id} + overage sale mas barato.`,
        });
      }
      const marginPerMinutePrevious = planEconomics(previous).effectivePerMinuteCOP;
      if (economics.effectivePerMinuteCOP >= marginPerMinutePrevious) {
        findings.push({
          code: 'NO_DECRECE_POR_MINUTO',
          planId: plan.id,
          detail: `$${Math.round(economics.effectivePerMinuteCOP)}/min >= $${Math.round(marginPerMinutePrevious)}/min de ${previous.id}.`,
        });
      }
    }
  });

  return findings;
}

/** Resumen legible de una escalera: una fila por plan, para documentos y reportes. */
export function tariffSummary(plans: readonly TariffPlan[], overageCOP = OVERAGE_COP) {
  return plans.map((plan) => ({
    id: plan.id,
    setupCOP: plan.setupCOP,
    overageCOP,
    ...planEconomics(plan),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// GRANDFATHERING — política de clientes actuales (ratificada sep-2026)
//
// Decisión: la tarifa final aplica a activaciones nuevas y renovaciones; los
// contratos firmados antes de la fecha de vigencia conservan SU tarifa hasta la
// renovación. No se renegocia a la baja en medio de un contrato ni se le sube el
// overage a un cliente que ya firmó con $547.
//
// Esto no es una nota de color: se ejecuta. `createActivationPaymentLink` resuelve
// el inicio del contrato con el primer pago aprobado del cliente y calcula el monto
// con resolveContractTariff(), no con el precio del catálogo a ciegas.
// ─────────────────────────────────────────────────────────────────────────────

/** Fecha desde la que rige la tarifa final (los contratos previos quedan congelados). */
export const FINAL_TARIFF_EFFECTIVE_FROM = '2026-10-01';

export type VerticalPricing = 'health' | 'inmobiliaria';

export type LegacyTariff = {
  monthlyCOP: number;
  setupCOP: number;
  overageCOP: number;
  /** Por qué ese plan cambió de tarifa. */
  note: string;
};

/** Tarifas retiradas, conservadas como registro histórico y para clientes vigentes. */
export const LEGACY_TARIFFS: Record<string, LegacyTariff> = {
  'health:consultorio-600': {
    monthlyCOP: 769000,
    setupCOP: 590000,
    overageCOP: 750,
    note: 'Precio anclado a insercion en desarrollo clinico (retirada sep-2026).',
  },
  'health:clinica-pro-1800': {
    monthlyCOP: 1914000,
    setupCOP: 1200000,
    overageCOP: 750,
    note: 'Precio anclado a insercion en desarrollo clinico (retirada sep-2026).',
  },
  'health:ips-plus-8000': {
    monthlyCOP: 7109000,
    setupCOP: 1900000,
    overageCOP: 700,
    note: 'Precio anclado a insercion en desarrollo clinico (retirada sep-2026).',
  },
  'health:ips-enterprise-25000': {
    monthlyCOP: 19617000,
    setupCOP: 3500000,
    overageCOP: 700,
    note: 'Precio anclado a insercion en desarrollo clinico (retirada sep-2026).',
  },
  'inmobiliaria:starter-600': {
    monthlyCOP: 399000,
    setupCOP: 0,
    overageCOP: 547,
    note: 'Overage por debajo del piso de margen del 40%.',
  },
  'inmobiliaria:profesional-1500': {
    monthlyCOP: 999000,
    setupCOP: 0,
    overageCOP: 547,
    note: 'Sin descuento por volumen y overage por debajo del piso.',
  },
  'inmobiliaria:sucursal-4000': {
    monthlyCOP: 2499000,
    setupCOP: 199000,
    overageCOP: 547,
    note: 'Plan dominado por "Profesional + overage" y overage bajo el piso.',
  },
  'inmobiliaria:red-10000': {
    monthlyCOP: 4999000,
    setupCOP: 499000,
    overageCOP: 547,
    note: 'Margen de 20% a uso completo (bajo el piso del 30%).',
  },
};

export function legacyTariffKey(vertical: VerticalPricing, planId: string): string {
  return `${vertical}:${planId}`;
}

export type ContractTariff = {
  applied: 'legacy' | 'final';
  monthlyCOP: number;
  setupCOP: number;
  overageCOP: number;
  reason: string;
};

/**
 * Tarifa que le corresponde a un contrato. Cliente nuevo o renovado → tarifa final;
 * cliente anterior a la vigencia → su tarifa, hasta que renueve.
 */
export function resolveContractTariff(input: {
  vertical: VerticalPricing;
  planId: string;
  /** Inicio del contrato vigente (primer pago aprobado del cliente). */
  contractStartedAt?: string | Date | null;
  /** Fecha de la última renovación, si ya renovó. */
  renewedAt?: string | Date | null;
  /** Tarifa final vigente en el catálogo. */
  final: { monthlyCOP: number; setupCOP: number; overageCOP: number };
}): ContractTariff {
  const effectiveFrom = new Date(`${FINAL_TARIFF_EFFECTIVE_FROM}T00:00:00Z`);
  const legacy = LEGACY_TARIFFS[legacyTariffKey(input.vertical, input.planId)];
  const startedAt = input.contractStartedAt ? new Date(input.contractStartedAt) : null;
  const renewedAt = input.renewedAt ? new Date(input.renewedAt) : null;
  const startedBefore = Boolean(startedAt && !Number.isNaN(startedAt.getTime()) && startedAt < effectiveFrom);
  const renewedAfter = Boolean(renewedAt && !Number.isNaN(renewedAt.getTime()) && renewedAt >= effectiveFrom);

  if (legacy && startedBefore && !renewedAfter) {
    return {
      applied: 'legacy',
      monthlyCOP: legacy.monthlyCOP,
      setupCOP: legacy.setupCOP,
      overageCOP: legacy.overageCOP,
      reason:
        'Cliente anterior al ' + FINAL_TARIFF_EFFECTIVE_FROM + ': conserva su tarifa hasta la renovacion.',
    };
  }
  return {
    applied: 'final',
    monthlyCOP: input.final.monthlyCOP,
    setupCOP: input.final.setupCOP,
    overageCOP: input.final.overageCOP,
    reason: renewedAfter
      ? 'Contrato renovado despues del ' + FINAL_TARIFF_EFFECTIVE_FROM + ': aplica la tarifa final.'
      : 'Sin contrato previo: aplica la tarifa final.',
  };
}
