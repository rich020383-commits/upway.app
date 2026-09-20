import { describe, it, expect } from 'vitest';
import {
  HEALTH_PLANS,
  planMath,
  isImplementationIntakeReady,
  COST_PER_MIN_COP,
  recargaBreakdown,
  simulateRecarga,
  COST_PER_NUMBER_COP,
  planQuote,
  IDENTITY_MODULE_COP,
} from './plans';
import {
  ALL_HEALTH_PLANS,
  estimateMinutesFromVolume,
  getHealthPlan,
  recommendPlan,
  planCommercialSummary,
} from './plans-enterprise';

describe('planMath — márgenes honestos', () => {
  it('Consultorio 600 deja margen ~65% (TRM 3.090)', () => {
    const p = HEALTH_PLANS.find((x) => x.id === 'consultorio-600')!;
    const m = planMath(p.monthlyCOP, p.includedMinutes, p.includedNumbers);
    expect(m.marginPct).toBeGreaterThanOrEqual(55);
    expect(m.grossProfitCOP).toBeGreaterThan(450_000);
  });

  it('Clínica Pro 1800 deja margen ~61%', () => {
    const p = HEALTH_PLANS.find((x) => x.id === 'clinica-pro-1800')!;
    const m = planMath(p.monthlyCOP, p.includedMinutes, p.includedNumbers);
    expect(m.marginPct).toBeGreaterThanOrEqual(55);
  });

  it('IPS Plus 8000 deja margen ~45%+', () => {
    const p = HEALTH_PLANS.find((x) => x.id === 'ips-plus-8000')!;
    const m = planMath(p.monthlyCOP, p.includedMinutes, p.includedNumbers);
    expect(m.marginPct).toBeGreaterThanOrEqual(40);
  });

  it('IPS Enterprise 25000 deja margen ~35%+', () => {
    const p = ALL_HEALTH_PLANS.find((x) => x.id === 'ips-enterprise-25000')!;
    const m = planMath(p.monthlyCOP, p.includedMinutes, p.includedNumbers);
    expect(m.marginPct).toBeGreaterThanOrEqual(35);
  });

  it('costo all-in por minuto en COP es ~379 (TRM 3.090)', () => {
    expect(COST_PER_MIN_COP).toBeGreaterThanOrEqual(355);
    expect(COST_PER_MIN_COP).toBeLessThanOrEqual(400);
  });
});

describe('recommendPlan', () => {
  it('recomienda consultorio para bajo volumen', () => {
    expect(recommendPlan('consultorio', 400).id).toBe('consultorio-600');
  });

  it('recomienda clínica pro para clínicas', () => {
    expect(recommendPlan('clinica', 1500).id).toBe('clinica-pro-1800');
  });

  it('recomienda IPS Plus / Enterprise según minutos', () => {
    expect(recommendPlan('ips', 7000).id).toBe('ips-plus-8000');
    expect(recommendPlan('ips', 22000).id).toBe('ips-enterprise-25000');
  });

  it('EPS o 60k+ → custom no auto-activable', () => {
    const p = recommendPlan('eps', 80000);
    expect(p.id).toBe('eps-custom');
    expect(p.autoActivatable).toBe(false);
  });
});

describe('estimateMinutesFromVolume', () => {
  it('calcula minutos mensuales = calls × duración × 30', () => {
    expect(estimateMinutesFromVolume(50, 4)).toBe(6_000);
    expect(estimateMinutesFromVolume(0, 5)).toBe(0);
  });
});

describe('getHealthPlan + summary', () => {
  it('resuelve plan por id', () => {
    expect(getHealthPlan('clinica-pro-1800')?.name).toBe('Clinica Pro');
    expect(getHealthPlan('nope')).toBeNull();
  });

  it('summary comercial incluye labels', () => {
    const p = getHealthPlan('consultorio-600')!;
    const s = planCommercialSummary(p);
    expect(s.monthlyLabel).toContain('769');
    expect(s.math?.marginPct).toBeGreaterThan(55);
  });
});

describe('isImplementationIntakeReady', () => {
  it('exige campos mínimos para implementar', () => {
    expect(isImplementationIntakeReady({})).toBe(false);
    expect(
      isImplementationIntakeReady({
        facilityType: 'ips',
        legalName: 'IPS Demo SAS',
        nit: '900123456',
        contactName: 'Ana Ops',
        contactPhone: '3001234567',
        contactEmail: 'ana@ips.com',
        dailyCalls: 80,
        avgCallMinutes: 3,
        planId: 'ips-plus-8000',
      })
    ).toBe(true);
  });
});

describe('MODELO RECARGA (prepago) — el cliente paga su propio consumo', () => {
  it('desglosa recarga: reserva Telnyx + margen inmediato (dividendo)', () => {
    const r = recargaBreakdown(769_000, 600, 1);
    expect(r.coversCost).toBe(true);
    expect(r.telnyxReserveCOP).toBe(600 * COST_PER_MIN_COP + COST_PER_NUMBER_COP);
    expect(r.marginCOP).toBe(769_000 - r.telnyxReserveCOP);
    expect(r.marginPct).toBeGreaterThan(50);
  });

  it('sí la recarga no cubre la reserva → coversCost=false y margen negativo', () => {
    const r = recargaBreakdown(100_000, 600, 1);
    expect(r.coversCost).toBe(false);
    expect(r.marginCOP).toBeLessThan(0);
  });

  it('simula consumo: el costo sale del fondo del cliente, sin financiar', () => {
    const s = simulateRecarga(769_000, 600, 1, 600);
    expect(s.overageMinutes).toBe(0);
    expect(s.telnyxCostUsedCOP).toBe(600 * COST_PER_MIN_COP + COST_PER_NUMBER_COP);
    expect(s.remainingCOP).toBe(769_000 - s.telnyxCostUsedCOP);
    expect(s.needsTopUpCOP).toBe(0);
  });

  it('simula overage: minutos extra se descuentan del fondo; si falta, needsTopUp', () => {
    const s = simulateRecarga(100_000, 600, 1, 700);
    expect(s.overageMinutes).toBe(100);
    expect(s.needsTopUpCOP).toBeGreaterThan(0);
    expect(s.remainingCOP).toBeLessThan(0);
  });

  it('nunca financiamos: el margen no toca Telnyx en la recarga', () => {
    const r = recargaBreakdown(769_000, 600, 1);
    expect(r.telnyxReserveCOP + r.marginCOP).toBe(r.recargaCOP);
  });
});

describe('MODULO IDENTIDAD CONFORME — no escala con los minutos', () => {
  it('la cotizacion sin modulo es solo el plan base', () => {
    const q = planQuote(769_000);
    expect(q.baseCOP).toBe(769_000);
    expect(q.identityModuleCOP).toBe(0);
    expect(q.totalCOP).toBe(769_000);
  });

  it('con modulo suma identidad + IVA sobre el total', () => {
    const q = planQuote(769_000, { withIdentityModule: true });
    expect(q.identityModuleCOP).toBe(IDENTITY_MODULE_COP);
    expect(q.totalCOP).toBe(769_000 + IDENTITY_MODULE_COP);
    expect(q.ivaCOP).toBe(Math.round(q.totalCOP * 0.19));
    expect(q.totalConIvaCOP).toBe(q.totalCOP + q.ivaCOP);
  });

  it('el modulo es fijo: no depende de los minutos del plan', () => {
    const consultorio = planQuote(769_000, { withIdentityModule: true });
    const enterprise = planQuote(19_617_000, { withIdentityModule: true });
    expect(consultorio.identityModuleCOP).toBe(enterprise.identityModuleCOP);
  });

  it('sube el margen del plan grande (donde la voz sola cae a ~38%)', () => {
    const plan = ALL_HEALTH_PLANS.find((p) => p.id === 'ips-enterprise-25000')!;
    const soloVoz = planMath(plan.monthlyCOP, plan.includedMinutes, plan.includedNumbers);
    const conModulo = planQuote(plan.monthlyCOP, { withIdentityModule: true });
    const margenConModulo = Math.round(
      ((conModulo.totalCOP - soloVoz.totalCostCOP) / conModulo.totalCOP) * 100
    );
    expect(margenConModulo).toBeGreaterThan(soloVoz.marginPct);
    expect(margenConModulo).toBeGreaterThanOrEqual(38);
  });

  it('summary comercial expone ambas cotizaciones', () => {
    const p = getHealthPlan('consultorio-600')!;
    const s = planCommercialSummary(p);
    expect(s.identityModuleCOP).toBe(IDENTITY_MODULE_COP);
    expect(s.quoteWithoutIdentity?.totalCOP).toBe(769_000);
    expect(s.quoteWithIdentity?.totalCOP).toBe(769_000 + IDENTITY_MODULE_COP);
  });

  it('plan custom (a cotizar) no expone cotizacion de modulo', () => {
    const p = getHealthPlan('eps-custom')!;
    const s = planCommercialSummary(p);
    expect(s.quoteWithIdentity).toBeNull();
    expect(s.quoteWithoutIdentity).toBeNull();
  });
});

