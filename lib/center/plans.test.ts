import { describe, it, expect } from 'vitest';
import {
  CENTER_PLANS,
  CENTER_SERVICE_LINES,
  STANDARD_CENTER_PLANS,
  contactCostAtPlanCOP,
  contactSavingsVsHumanPct,
  getServiceLine,
  humanAgentEconomics,
  humanContactBillableCOP,
  planPerMinuteCOP,
  AUXILIO_TRANSPORTE_2026_COP,
  DEFAULT_OCCUPANCY,
  HUMAN_GESTOR_MIN_BILLABLE_USD_HOUR,
  SMMLV_2026_COP,
} from './plans';
import {
  auditTariff,
  costModelAtTRM,
  overageMarginPct,
  planEconomics,
  stepRateCOP,
  HUMAN_TIER1_BILLABLE_USD_HOUR,
  OVERAGE_COP,
  PLANNING_UTILIZATION,
  type TariffPlan,
} from '@/lib/pricing/rules';

const CENTER: TariffPlan[] = [...CENTER_PLANS];
const paid = () => STANDARD_CENTER_PLANS;

describe('alcance de Upway Center: solo dos lineas de servicio', () => {
  it('las lineas son atencion al cliente y soporte tecnico N1', () => {
    expect(CENTER_SERVICE_LINES.map((line) => line.id)).toEqual([
      'atencion-cliente',
      'soporte-tecnico',
    ]);
    expect(getServiceLine('atencion-cliente')?.referenceAhtMinutes).toBe(5);
    expect(getServiceLine('soporte-tecnico')?.referenceAhtMinutes).toBe(7);
    expect(getServiceLine('cobranza')).toBeNull();
  });

  it('cada linea declara lo que NO hace (guardarrail explicito)', () => {
    for (const line of CENTER_SERVICE_LINES) {
      expect(line.excludes.length).toBeGreaterThanOrEqual(3);
      expect(line.requires.length).toBeGreaterThanOrEqual(3);
      expect(line.includes.length).toBeGreaterThanOrEqual(4);
    }
    const texto = CENTER_SERVICE_LINES.flatMap((line) => [...line.excludes]).join(' ').toLowerCase();
    expect(texto).toContain('cobranza');
  });

  it('cada plan declara a que linea pertenece', () => {
    for (const plan of paid()) {
      expect(getServiceLine(plan.serviceLine)).not.toBeNull();
    }
  });
});

describe('auditoria de tarifas de Upway Center (R0-R7)', () => {
  it('la escalera cumple todas las reglas con la misma tarifa de minuto', () => {
    expect(auditTariff(CENTER)).toEqual([]);
  });

  it('el overage es la misma tarifa unica de Upway ($690)', () => {
    expect(paid().map((plan) => plan.overageCOP)).toEqual([690, 690, 690, 690]);
    expect(OVERAGE_COP).toBe(690);
  });
});

describe('tarifa final de Upway Center', () => {
  it('precios por plan', () => {
    expect(paid().map((plan) => plan.monthlyCOP)).toEqual([699000, 1949000, 4990000, 14990000]);
  });

  it('$/min implicito decreciente: 699 > 650 > 624 > 600', () => {
    expect(paid().map((plan) => Math.round(planPerMinuteCOP(plan)))).toEqual([699, 650, 624, 600]);
  });

  it('margenes: 30%+ a uso completo y 55%+ a utilizacion de planeacion', () => {
    expect(paid().map((plan) => Math.round(planEconomics(plan).marginFullPct * 10) / 10)).toEqual([
      39.8, 37.4, 35.9, 34.6,
    ]);
    for (const plan of paid()) {
      expect(planEconomics(plan).marginPlanningPct, plan.id).toBeGreaterThanOrEqual(55);
    }
  });

  it('ningun escalon cuesta mas que el overage (sin arbitraje)', () => {
    const plans = paid();
    plans.forEach((plan, index) => {
      if (index === 0) return;
      expect(stepRateCOP(plans[index - 1], plan), plan.id).toBeLessThanOrEqual(OVERAGE_COP * 0.95);
    });
  });
});

describe('estres por TRM: la tarifa aguanta sin tocar precios', () => {
  it('con la TRM vigente (3.204) sigue cumpliendo R0-R7', () => {
    const modelo = costModelAtTRM(3204);
    expect(auditTariff(CENTER, OVERAGE_COP, modelo)).toEqual([]);
    expect(overageMarginPct(OVERAGE_COP, modelo.costPerMinCOP)).toBeGreaterThanOrEqual(40);
  });

  it('incluso en el disparador de revision (3.300) la escalera se sostiene', () => {
    const modelo = costModelAtTRM(3300);
    expect(auditTariff(CENTER, OVERAGE_COP, modelo)).toEqual([]);
    // El plan mas grande queda justo sobre el piso de 30%: por eso 3.300 dispara revision.
    const top = planEconomics(paid()[3], PLANNING_UTILIZATION, modelo);
    expect(top.marginFullPct).toBeGreaterThanOrEqual(30);
    expect(top.marginFullPct).toBeLessThan(32);
  });
});

describe('economia del escalamiento humano (calculada, no afirmada)', () => {
  const economics = humanAgentEconomics();

  it('SMMLV 2026 + auxilio = $2.000.000 (dato oficial)', () => {
    expect(SMMLV_2026_COP).toBe(1_750_905);
    expect(AUXILIO_TRANSPORTE_2026_COP).toBe(249_095);
    expect(SMMLV_2026_COP + AUXILIO_TRANSPORTE_2026_COP).toBe(2_000_000);
  });

  it('una posicion cargada con supervision cuesta ~$4,7M/mes (~$26.700/h)', () => {
    expect(economics.monthlyLoadedCOP).toBe(3_914_172);
    expect(economics.monthlyWithOverheadCOP).toBe(4_697_006);
    expect(economics.costPerHourCOP).toBe(26_688);
    expect(economics.costPerHourUSD).toBeCloseTo(8.64, 2);
  });

  it('facturar el humano deja 38% a tarifa de mercado y 33% en el piso Upway', () => {
    expect(economics.marginPct).toBeGreaterThan(35);
    expect(economics.marginPct).toBeLessThan(42);
    const piso = humanAgentEconomics({ billableUSDPerHour: HUMAN_GESTOR_MIN_BILLABLE_USD_HOUR });
    expect(piso.marginPct).toBeGreaterThan(30);
    expect(piso.marginPct).toBeLessThan(36);
    expect(economics.marginPct).toBeLessThan(planEconomics(paid()[0]).marginPlanningPct);
    expect(HUMAN_GESTOR_MIN_BILLABLE_USD_HOUR).toBe(12.9);
    expect(HUMAN_TIER1_BILLABLE_USD_HOUR).toBe(14);
  });

  it('el humano se paga tambien cuando no habla: su minuto hablado cuesta mas que su factura', () => {
    expect(DEFAULT_OCCUPANCY).toBe(0.4);
    expect(economics.costPerTalkMinuteCOP).toBe(1_112);
    expect(economics.billablePerTalkMinuteCOP).toBe(1_803);
    expect(economics.billablePerTalkMinuteCOP / economics.costPerTalkMinuteCOP).toBeGreaterThan(1.5);
  });
});

describe('la cuenta por contacto (el numero que se le dice al cliente)', () => {
  it('un contacto de atencion (5 min) cuesta ~$3.248 con Upway vs ~$9.015 humano', () => {
    const plan = paid().find((p) => p.id === 'atencion-3000')!;
    expect(contactCostAtPlanCOP(plan)).toBe(3_248);
    expect(humanContactBillableCOP(5)).toBe(9_015);
    expect(contactSavingsVsHumanPct(plan)).toBeGreaterThan(60);
  });

  it('un contacto de soporte tecnico (7 min) ahorra mas del 60%', () => {
    const plan = paid().find((p) => p.id === 'soporte-8000')!;
    expect(contactSavingsVsHumanPct(plan)).toBeGreaterThan(60);
  });

  it('ningun plan inventa ahorros: todos baten al humano facturable', () => {
    for (const plan of paid()) {
      expect(contactSavingsVsHumanPct(plan), plan.id).toBeGreaterThan(55);
    }
  });
});
