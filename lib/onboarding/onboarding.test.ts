import { describe, expect, it } from 'vitest';
import { stageErrors, stageMeta } from '@/lib/onboarding/types';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';

describe('motor de onboarding vertical', () => {
  const configs = [INMOBILIARIA_ONBOARDING, CENTER_ONBOARDING];

  it.each(configs.map((c) => [c.segment, c] as const))('%s: config con etapas válidas', (_segment, config) => {
    expect(config.label.length).toBeGreaterThan(0);
    expect(config.stages.length).toBeGreaterThanOrEqual(5);

    const ids = config.stages.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const stage of config.stages) {
      expect(stage.eyebrow.length).toBeGreaterThan(0);
      expect(stage.titulo.length).toBeGreaterThan(0);
    }
  });

  it.each(configs.map((c) => [c.segment, c] as const))('%s: etapa de plan con planes reales', (_segment, config) => {
    const planStage = config.stages.find((s) => s.plans);
    expect(planStage).toBeDefined();
    expect((planStage?.plans ?? []).length).toBeGreaterThanOrEqual(2);

    for (const plan of planStage?.plans ?? []) {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.monthlyCOP).toBeGreaterThan(0);
    }
  });

  it('exige campos requeridos con su etiqueta y valida el plan', () => {
    const config = INMOBILIARIA_ONBOARDING;
    const empresa = config.stages[0];
    const errs = stageErrors(empresa, {});
    expect(errs.length).toBe(empresa.fields?.length ?? 0);
    expect(errs.join(' ')).toContain('Nombre de la inmobiliaria');

    const ok = stageErrors(empresa, Object.fromEntries((empresa.fields ?? []).map((f) => [f.id, 'x'])));
    expect(ok).toEqual([]);

    const planStage = config.stages.find((s) => s.plans)!;
    expect(stageErrors(planStage, {})).toContain('Selecciona un plan para continuar.');
    expect(stageErrors(planStage, { planId: planStage.plans![0].id })).toEqual([]);
  });

  it('stageMeta refleja el avance', () => {
    expect(stageMeta(0, 0, 3)).toBe('IN PROGRESS');
    expect(stageMeta(0, 1, 3)).toBe('COMPLETED');
    expect(stageMeta(1, 0, 3)).toBe('DRAFT');
    expect(stageMeta(2, 2, 3)).toBe('PENDING_REVIEW');
  });
});