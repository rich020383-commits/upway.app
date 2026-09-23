import { describe, expect, it } from 'vitest';
import {
  stageErrors,
  stageMeta,
  submissionCompanyName,
  submissionPlanName,
  submissionRows,
} from '@/lib/onboarding/types';
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

    const ok = stageErrors(
      empresa,
      Object.fromEntries(
        (empresa.fields ?? []).map((f) => [f.id, f.kind === 'email' ? 'contacto@upway.business' : 'x'])
      )
    );
    expect(ok).toEqual([]);

    // El correo es obligatorio y debe ser válido: es donde llega el ACK del cliente.
    expect(stageErrors(empresa, { contactoEmail: 'no-es-correo' })).toContain(
      'Ingresa un correo electrónico válido.'
    );

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

  it.each(configs.map((c) => [c.segment, c] as const))(
    '%s: captura correo de contacto para notificar la revisión',
    (_segment, config) => {
      const emailField = config.stages
        .flatMap((stage) => stage.fields ?? [])
        .find((field) => field.kind === 'email');

      expect(emailField).toBeDefined();
      expect(emailField?.id).toBe('contactoEmail');
      expect(emailField?.required).not.toBe(false);
    }
  );

  it('submissionRows traduce ids a etiquetas sin perder respuestas heredadas', () => {
    const config = INMOBILIARIA_ONBOARDING;
    const planStage = config.stages.find((s) => s.plans)!;
    const planId = planStage.plans![0].id;

    const answers: Record<string, string> = {
      empresa: 'Inmobiliaria Norte',
      contactoEmail: 'contacto@norte.com',
      planId,
      // Respuesta de una versión previa del wizard (campo ya inexistente).
      campoviejo: 'dato heredado',
    };

    const rows = submissionRows(config, answers);
    expect(rows).toContainEqual(['Nombre de la inmobiliaria', 'Inmobiliaria Norte']);
    expect(rows).toContainEqual(['Correo de contacto', 'contacto@norte.com']);
    expect(rows).toContainEqual(['campoviejo', 'dato heredado']);
    // El plan no se duplica como fila cruda: se resuelve aparte.
    expect(rows.some(([label]) => label === 'planId')).toBe(false);
    // Los campos vacíos no generan filas de ruido.
    expect(rows.some(([label]) => label === 'Ciudad o zona')).toBe(false);
  });

  it('submissionPlanName y submissionCompanyName alimentan el asunto del correo', () => {
    const config = CENTER_ONBOARDING;
    const planStage = config.stages.find((s) => s.plans)!;
    const plan = planStage.plans![0];

    expect(submissionPlanName(config, { planId: plan.id })).toBe(plan.name);
    expect(submissionPlanName(config, { planId: 'plan-inexistente' })).toBe('plan-inexistente');
    expect(submissionPlanName(config, {})).toBe('');
    expect(submissionCompanyName({ empresa: '  ServiTech  ' })).toBe('ServiTech');
    expect(submissionCompanyName({})).toBe('');
  });
});