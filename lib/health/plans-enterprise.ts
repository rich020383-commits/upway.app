import type { FacilityType, HealthPlan } from './plans';
import { HEALTH_PLANS, planMath } from './plans';

export const HEALTH_PLANS_ENTERPRISE: HealthPlan[] = [
  {
    id: 'ips-enterprise-25000',
    name: 'IPS Enterprise',
    target: ['ips'],
    tagline: 'Alto volumen con margen sano (~38%).',
    monthlyCOP: 19617000,
    setupCOP: 3500000,
    includedMinutes: 25000,
    includedNumbers: 8,
    overageCOP: 700,
    concurrentCalls: 60,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año',
    features: [
      '8 numeros dedicados',
      '25,000 min/mes + overage $700 COP',
      'Hasta 60 simultaneas (capacidad ampliada)',
      'Soporte dedicado + SLA',
      'White-glove + onboarding tecnico Upway',
    ],
    bestFor: 'IPS grandes con desborde 24/7.',
    autoActivatable: true,
  },
  {
    id: 'eps-custom',
    name: 'EPS / Red (Custom)',
    target: ['eps', 'ips'],
    tagline: '60k-200k min: cotizacion por volumen.',
    monthlyCOP: 0,
    setupCOP: 0,
    includedMinutes: 60000,
    includedNumbers: 10,
    overageCOP: 0,
    concurrentCalls: 100,
    requiresTelnyxApproval: true,
    recordingRetention: '1 año (a confirmar)',
    features: [
      'Cotizar: costo / (1 - 0.35) + numeros + soporte',
      '60k min costo ~$29.2M: a $46.9M deja ~38%',
      '200k min: exigir $100M+ o tarifa <= $450/min all-in',
      '300 simultaneas requieren capacidad ampliada antes de firmar',
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

export function recommendPlan(facilityType: string, estimatedMinutes: number): HealthPlan {
  if (facilityType === 'eps' || estimatedMinutes >= 60000) {
    return ALL_HEALTH_PLANS.find((p) => p.id === 'eps-custom')!;
  }
  if (facilityType === 'ips') {
    if (estimatedMinutes >= 20000) return ALL_HEALTH_PLANS.find((p) => p.id === 'ips-enterprise-25000')!;
    return ALL_HEALTH_PLANS.find((p) => p.id === 'ips-plus-8000')!;
  }
  if (facilityType === 'clinica' || estimatedMinutes >= 1200) {
    return ALL_HEALTH_PLANS.find((p) => p.id === 'clinica-pro-1800')!;
  }
  if (facilityType === 'centro-medico' && estimatedMinutes >= 900) {
    return ALL_HEALTH_PLANS.find((p) => p.id === 'clinica-pro-1800')!;
  }
  return ALL_HEALTH_PLANS.find((p) => p.id === 'consultorio-600')!;
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
    setupLabel: formatCOP(plan.setupCOP),
    overageLabel: plan.overageCOP > 0 ? ('$' + plan.overageCOP.toLocaleString('es-CO') + ' COP/min') : 'A cotizar',
    approvalNote: plan.requiresTelnyxApproval
      ? 'Requiere ampliar la capacidad de simultaneidad (lo tramita Upway).'
      : 'Sin approval extra: capacidad estandar.',
  };
}
