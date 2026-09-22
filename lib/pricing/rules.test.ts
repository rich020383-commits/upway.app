import { describe, it, expect } from 'vitest';
import {
  auditTariff,
  cheapestTariffForMinutes,
  crossoverMinutes,
  overageMarginPct,
  planEconomics,
  stepRateCOP,
  tariffSummary,
  COST_PER_MIN_COP,
  COST_PER_NUMBER_COP,
  DEAL_DESK_FLOOR_PER_MIN_COP,
  FINAL_TARIFF_EFFECTIVE_FROM,
  HUMAN_BILLABLE_MIN_COP,
  LEGACY_TARIFFS,
  MAX_STEP_RATE_VS_OVERAGE,
  OVERAGE_COP,
  PLANNING_UTILIZATION,
  resolveContractTariff,
  type TariffPlan,
} from './rules';
import { HEALTH_PLANS } from '@/lib/health/plans';
import { HEALTH_PLANS_ENTERPRISE } from '@/lib/health/plans-enterprise';
import { INMOBILIARIA_PLANS } from '@/lib/inmobiliaria/plans';

const HEALTH: TariffPlan[] = [...HEALTH_PLANS, ...HEALTH_PLANS_ENTERPRISE];
const INMOB: TariffPlan[] = [...INMOBILIARIA_PLANS];
const paidOf = (plans: TariffPlan[]) => plans.filter((p) => p.monthlyCOP > 0);

describe('Costos reales y tarifa unica de minuto adicional', () => {
  it('costo all-in $379/min y numero $41.715/mes (TRM 3.090)', () => {
    expect(COST_PER_MIN_COP).toBe(379);
    expect(COST_PER_NUMBER_COP).toBe(41715);
  });

  it('overage final $690/min con 45,1% de margen (piso 40%)', () => {
    expect(OVERAGE_COP).toBe(690);
    expect(overageMarginPct()).toBeGreaterThanOrEqual(40);
  });

  it('la referencia de valor es el minuto humano facturado: $721', () => {
    expect(HUMAN_BILLABLE_MIN_COP).toBe(721);
  });

  it('el piso de deal desk deja al menos 30% de margen', () => {
    const margin = (DEAL_DESK_FLOOR_PER_MIN_COP - COST_PER_MIN_COP) / DEAL_DESK_FLOOR_PER_MIN_COP;
    expect(margin).toBeGreaterThanOrEqual(0.3);
  });
});

describe('auditoria de tarifas (reglas R0-R7)', () => {
  it('Health cumple todas las reglas', () => {
    expect(auditTariff(HEALTH)).toEqual([]);
  });

  it('Inmobiliarias cumple todas las reglas', () => {
    expect(auditTariff(INMOB)).toEqual([]);
  });

  it('detecta la escalera invertida que se vendia antes (Health sep-2026)', () => {
    const rota: TariffPlan[] = [
      { id: 'viejo-600', name: 'Consultorio', monthlyCOP: 769000, setupCOP: 590000, includedMinutes: 600, includedNumbers: 1, overageCOP: 750 },
      { id: 'viejo-1800', name: 'Clinica Pro', monthlyCOP: 1914000, setupCOP: 1200000, includedMinutes: 1800, includedNumbers: 2, overageCOP: 750 },
    ];
    const codes = auditTariff(rota, 750).map((f) => f.code);
    expect(codes).toContain('ESCALON_MAS_CARO_QUE_OVERAGE');
    expect(codes).toContain('MINUTO_SOBRE_HUMANO');
  });
});

describe('tarifa final cerrada — Health', () => {
  it('precios por plan', () => {
    expect(paidOf(HEALTH).map((p) => p.monthlyCOP)).toEqual([429000, 1199000, 4890000, 14490000]);
  });

  it('overage unico de $690 en los 4 planes', () => {
    expect(paidOf(HEALTH).map((p) => p.overageCOP)).toEqual([690, 690, 690, 690]);
  });

  it('$/min implicito decreciente: 715 > 666 > 611 > 580', () => {
    expect(paidOf(HEALTH).map((p) => Math.round(p.monthlyCOP / p.includedMinutes))).toEqual([
      715, 666, 611, 580,
    ]);
  });

  it('margenes: 30%+ a uso completo y 55%+ a utilizacion de planeacion', () => {
    for (const plan of paidOf(HEALTH)) {
      const economics = planEconomics(plan);
      expect(economics.marginFullPct, plan.id).toBeGreaterThanOrEqual(30);
      expect(economics.marginPlanningPct, plan.id).toBeGreaterThanOrEqual(55);
    }
  });
});

describe('tarifa final cerrada — Inmobiliarias', () => {
  it('precios por plan', () => {
    expect(INMOB.map((p) => p.monthlyCOP)).toEqual([399000, 959000, 2459000, 5890000]);
  });

  it('$/min implicito decreciente: 665 > 639 > 615 > 589', () => {
    expect(INMOB.map((p) => Math.round(p.monthlyCOP / p.includedMinutes))).toEqual([
      665, 639, 615, 589,
    ]);
  });

  it('ya no existe el plan Sucursal dominado por "Profesional + overage"', () => {
    const [starter, profesional, sucursal, red] = INMOB;
    const alternativa = (plan: TariffPlan, minutes: number) =>
      plan.monthlyCOP + (minutes - plan.includedMinutes) * OVERAGE_COP;
    expect(alternativa(profesional, sucursal.includedMinutes)).toBeGreaterThan(sucursal.monthlyCOP);
    expect(alternativa(sucursal, red.includedMinutes)).toBeGreaterThan(red.monthlyCOP);
    expect(alternativa(starter, profesional.includedMinutes)).toBeGreaterThan(profesional.monthlyCOP);
  });
});

describe('sin arbitraje: subir de plan es mas barato que quedarse pagando overage', () => {
  it('cada escalon cuesta <= 95% del overage', () => {
    for (const [name, plans] of [['health', HEALTH], ['inmob', INMOB]] as const) {
      const paid = paidOf(plans);
      paid.forEach((plan, index) => {
        if (index === 0) return;
        const step = stepRateCOP(paid[index - 1], plan);
        expect(step, `${name}:${plan.id}`).toBeLessThanOrEqual(
          OVERAGE_COP * MAX_STEP_RATE_VS_OVERAGE
        );
      });
    }
  });

  it('en el volumen de cada plan, ese plan es la opcion mas barata (incluido "menor + overage")', () => {
    for (const plans of [HEALTH, INMOB]) {
      for (const plan of paidOf(plans)) {
        const choice = cheapestTariffForMinutes(plans, plan.includedMinutes)!;
        expect(choice.plan.id).toBe(plan.id);
      }
    }
  });

  it('los cruces de tarifa son los umbrales honestos de recomendacion', () => {
    const paid = paidOf(HEALTH);
    expect(Math.round(crossoverMinutes(paid[0], paid[1]))).toBe(1716);
    expect(Math.round(crossoverMinutes(paid[1], paid[2]))).toBe(7149);
    expect(Math.round(crossoverMinutes(paid[2], paid[3]))).toBe(21913);
  });

  it('nadie paga mas por consumir mas minutos', () => {
    const paid = paidOf(INMOB);
    let previous = 0;
    for (let minutes = 0; minutes <= 12000; minutes += 50) {
      const choice = cheapestTariffForMinutes(paid, minutes)!;
      expect(choice.totalCOP).toBeGreaterThanOrEqual(previous);
      previous = choice.totalCOP;
    }
  });
});

describe('valor: ningun $/min de Upway supera el minuto humano', () => {
  it('planes y overage por debajo de $721 COP/min', () => {
    for (const plans of [HEALTH, INMOB]) {
      for (const plan of paidOf(plans)) {
        const perMinute = plan.monthlyCOP / plan.includedMinutes;
        expect(perMinute, plan.id).toBeLessThan(HUMAN_BILLABLE_MIN_COP);
      }
    }
    expect(OVERAGE_COP).toBeLessThan(HUMAN_BILLABLE_MIN_COP);
  });
});

describe('tariffSummary — reporte legible de la escalera', () => {
  it('expone costo, margen y $/min de cada plan', () => {
    const rows = tariffSummary(paidOf(HEALTH));
    expect(rows).toHaveLength(4);
    expect(rows[0].monthlyCOP).toBe(429000);
    expect(rows[0].costFullCOP).toBe(269115);
    expect(rows[0].marginPlanningPct).toBeGreaterThan(55);
    expect(PLANNING_UTILIZATION).toBe(0.55);
  });
});

describe('grandfathering — el cliente actual conserva su tarifa (ratificado sep-2026)', () => {
  const finalConsultorio = { monthlyCOP: 429000, setupCOP: 390000, overageCOP: 690 };

  it('cliente firmado antes de la vigencia conserva su tarifa', () => {
    const tariff = resolveContractTariff({
      vertical: 'health',
      planId: 'consultorio-600',
      contractStartedAt: '2026-08-15',
      final: finalConsultorio,
    });
    expect(tariff.applied).toBe('legacy');
    expect(tariff.monthlyCOP).toBe(769000);
    expect(tariff.setupCOP).toBe(590000);
    expect(tariff.overageCOP).toBe(750);
    expect(tariff.reason).toContain('conserva su tarifa');
  });

  it('cliente nuevo paga la tarifa final', () => {
    const tariff = resolveContractTariff({
      vertical: 'health',
      planId: 'consultorio-600',
      final: finalConsultorio,
    });
    expect(tariff.applied).toBe('final');
    expect(tariff.monthlyCOP).toBe(429000);
    expect(tariff.overageCOP).toBe(690);
  });

  it('al renovar despues de la vigencia entra la tarifa final', () => {
    const tariff = resolveContractTariff({
      vertical: 'health',
      planId: 'clinica-pro-1800',
      contractStartedAt: '2026-05-01',
      renewedAt: '2026-10-01',
      final: { monthlyCOP: 1199000, setupCOP: 690000, overageCOP: 690 },
    });
    expect(tariff.applied).toBe('final');
    expect(tariff.monthlyCOP).toBe(1199000);
    expect(tariff.reason).toContain('renovado');
  });

  it('en inmobiliarias el cliente viejo conserva el minuto adicional de $547', () => {
    const tariff = resolveContractTariff({
      vertical: 'inmobiliaria',
      planId: 'sucursal-4000',
      contractStartedAt: '2026-09-01',
      final: { monthlyCOP: 2459000, setupCOP: 390000, overageCOP: 690 },
    });
    expect(tariff.applied).toBe('legacy');
    expect(tariff.monthlyCOP).toBe(2499000);
    expect(tariff.overageCOP).toBe(547);
  });

  it('un plan sin historial no hereda tarifa vieja (no inventa descuentos)', () => {
    const tariff = resolveContractTariff({
      vertical: 'inmobiliaria',
      planId: 'plan-inexistente',
      contractStartedAt: '2026-01-01',
      final: { monthlyCOP: 1000000, setupCOP: 0, overageCOP: 690 },
    });
    expect(tariff.applied).toBe('final');
    expect(tariff.monthlyCOP).toBe(1000000);
  });

  it('la fecha de vigencia y el registro historico son explicitos', () => {
    expect(FINAL_TARIFF_EFFECTIVE_FROM).toBe('2026-10-01');
    expect(Object.keys(LEGACY_TARIFFS)).toHaveLength(8);
  });
});
