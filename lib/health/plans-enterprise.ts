import type { FacilityType, HealthPlan } from './plans';
import { DEFAULT_OVERAGE_COP, HEALTH_PLANS, planMath, planQuote, IVA_RATE, ivaDe, withIVA, IDENTITY_MODULE_COP, IDENTITY_MODULE_LABEL, IDENTITY_MODULE_DESCRIPTION } from './plans';
import { cheapestTariffForMinutes, OVERAGE_COP } from '@/lib/pricing/rules';

export const HEALTH_PLANS_ENTERPRISE: HealthPlan[] = [
  {
    id: 'ips-enterprise-25000',
    name: 'IPS Enterprise',
    target: ['ips'],
    tagline: 'Alto volumen: $580 COP/min implicito, con margen a uso completo.',
    monthlyCOP: 14490000,
    setupCOP: 2400000,
    includedMinutes: 25000,
    includedNumbers: 8,
    overageCOP: DEFAULT_OVERAGE_COP,
    concurrentCalls: 60,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '8 numeros dedicados',
      '25,000 min/mes + minuto adicional $690 COP',
      'Hasta 60 simultaneas (capacidad ampliada)',
      'Soporte dedicado + SLA',
      'Export del dato conforme (API/webhook/CSV)',
      'Implementacion multi-sede Upway',
    ],
    bestFor: 'IPS grandes con desborde 24/7.',
    autoActivatable: true,
  },
  {
    id: 'eps-custom',
    name: 'EPS / Red (Custom)',
    target: ['eps', 'ips'],
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
      '60.000 min: costo ~$23.2M con numeros -> piso ~$33.0M (~30% de margen)',
      '200.000 min: costo ~$76.2M con numeros -> piso ~$110M (~30% de margen)',
      '300 simultaneas requieren ampliar capacidad del proveedor antes de firmar',
      'No auto-activar: deal desk + cotizacion',
    ],
    bestFor: 'Redes/EPS: no vender fijo sin approval.',
    autoActivatable: false,
  },
];

export const ALL_HEALTH_PLANS: HealthPlan[] = [...HEALTH_PLANS, ...HEALTH_PLANS_ENTERPRISE];

export function getHealthPlan(planId: string | null | undefined): HealthPlan | null {
  if (!planId) return null;
  return ALL_HEALTH_PLANS.find((p) => p.id === planId) ?? null;
}

export function plansForFacility(facilityType: string | null | undefined): HealthPlan[] {
  if (!facilityType) return ALL_HEALTH_PLANS.filter((p) => p.monthlyCOP > 0);
  return ALL_HEALTH_PLANS.filter(
    (p) => p.target.includes(facilityType as FacilityType) || p.id === 'eps-custom'
  );
}

/**
 * Recomendacion honesta: el plan que MENOS le cuesta al cliente para su volumen.
 *
 * Antes el umbral era una cuota comercial fija (ips >= 20.000 min -> Enterprise) y
 * a las 20.000 min recomendaba un plan de $14.490.000 cuando "IPS Plus + 12.000 min
 * de overage" costaba $8.880.000: 63% mas caro que la alternativa. Hoy el umbral es
 * el punto de cruce real de la tarifa (crossoverMinutes), calculado desde los datos
 * de los planes, no desde una tabla a mano.
 */
export function recommendPlan(facilityType: string, estimatedMinutes: number): HealthPlan {
  if (facilityType === 'eps' || estimatedMinutes >= 60000) {
    return ALL_HEALTH_PLANS.find((p) => p.id === 'eps-custom')!;
  }
  const minutes = Math.max(0, Number(estimatedMinutes) || 0);
  const cheapest = (cheapestTariffForMinutes(ALL_HEALTH_PLANS, minutes, OVERAGE_COP)?.plan ??
    HEALTH_PLANS[0]) as HealthPlan;
  // Piso por capacidad, no por precio: una IPS opera varias lineas a la vez, asi que
  // no se le propone el plan de un solo numero. El cliente siempre ve la lista completa.
  if (facilityType === 'ips' && cheapest.includedNumbers < 2) {
    return ALL_HEALTH_PLANS.find((p) => p.id === 'clinica-pro-1800')!;
  }
  return cheapest;
}

export function estimateMinutesFromVolume(dailyCalls: number, avgDurationMin: number): number {
  const d = Math.max(0, Number(dailyCalls) || 0);
  const a = Math.max(0, Number(avgDurationMin) || 0);
  return Math.round(d * a * 30);
}

export function formatCOP(value: number): string {
  if (!value) return 'A cotizar';
  return '$' + Math.round(value).toLocaleString('es-CO') + ' COP';
}

export function planCommercialSummary(plan: HealthPlan) {
  const math = plan.monthlyCOP > 0 ? planMath(plan.monthlyCOP, plan.includedMinutes, plan.includedNumbers) : null;
  return {
    plan,
    math,
    monthlyLabel: formatCOP(plan.monthlyCOP),
    ivaCOP: plan.monthlyCOP > 0 ? ivaDe(plan.monthlyCOP) : 0,
    conIvaCOP: plan.monthlyCOP > 0 ? withIVA(plan.monthlyCOP) : 0,
    ivaLabel: plan.monthlyCOP > 0 ? "+ IVA " + (IVA_RATE * 100) + "% (" + ivaDe(plan.monthlyCOP).toLocaleString("es-CO") + " COP)" : "",
    precioConIVALabel: plan.monthlyCOP > 0 ? formatCOP(withIVA(plan.monthlyCOP)) : formatCOP(0),
    setupLabel: formatCOP(plan.setupCOP),
    overageLabel: plan.overageCOP > 0 ? ('$' + plan.overageCOP.toLocaleString('es-CO') + ' COP/min') : 'A cotizar',
    approvalNote: plan.requiresTelnyxApproval
      ? 'Requiere ampliar la capacidad de simultaneidad (lo tramita Upway).'
      : 'Sin approval extra: capacidad estandar.',
    // Modulo Identidad Conforme: adicional por sede/mes sobre el plan elegido.
    identityModuleCOP: IDENTITY_MODULE_COP,
    identityModuleLabel: IDENTITY_MODULE_LABEL,
    identityModuleDescription: IDENTITY_MODULE_DESCRIPTION,
    quoteWithoutIdentity: plan.monthlyCOP > 0 ? planQuote(plan.monthlyCOP) : null,
    quoteWithIdentity:
      plan.monthlyCOP > 0 ? planQuote(plan.monthlyCOP, { withIdentityModule: true }) : null,
  };
}
