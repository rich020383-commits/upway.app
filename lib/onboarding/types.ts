import { validateEmail, validateRequired } from '@/lib/validation';

/** Tipos del motor de onboarding vertical (patrón del wizard de Health). */

export type VerticalSegment = 'inmobiliaria' | 'center';

export type WizardFieldKind = 'text' | 'email' | 'tel' | 'textarea' | 'select';

export interface WizardField {
  id: string;
  label: string;
  kind?: WizardFieldKind;
  placeholder?: string;
  help?: string;
  options?: string[];
  required?: boolean;
}

/** Subconjunto de los planes que el wizard necesita para la etapa de plan. */
export interface PlanLite {
  id: string;
  name: string;
  tagline?: string;
  monthlyCOP: number;
  setupCOP?: number;
  includedMinutes?: number;
  includedNumbers?: number;
  features?: string[];
  bestFor?: string;
}

export interface WizardStage {
  id: string;
  /** Texto en mayúsculas sobre el título (estilo Health). */
  eyebrow: string;
  titulo: string;
  intro?: string;
  fields?: WizardField[];
  /** Etapa de selección de plan (kind implícito por presencia de plans). */
  plans?: readonly PlanLite[];
}

export interface OnboardingConfig {
  segment: VerticalSegment;
  /** Nombre público de la vertical (etiquetas, títulos). */
  label: string;
  stages: readonly WizardStage[];
}

/** Errores de una etapa: requeridos + email válido si el campo es email. */
export function stageErrors(stage: WizardStage, answers: Record<string, string>): string[] {
  const fields = stage.fields ?? [];
  const labels: Record<string, string> = {};
  for (const field of fields) labels[field.id] = field.label;
  const requiredIds = fields.filter((f) => f.required !== false).map((f) => f.id);
  const errors = [...validateRequired(requiredIds, answers, labels)];
  for (const field of fields) {
    if (field.kind === 'email' && answers[field.id]) {
      errors.push(...validateEmail(answers[field.id]));
    }
  }
  if (stage.plans && !answers.planId) {
    errors.push('Selecciona un plan para continuar.');
  }
  return errors;
}

/** Estado de la barra lateral para una etapa (códigos estilo Health). */
export function stageMeta(stageIndex: number, currentIndex: number, total: number): string {
  if (stageIndex < currentIndex) return 'COMPLETED';
  if (stageIndex === currentIndex) return stageIndex === total - 1 ? 'PENDING_REVIEW' : 'IN PROGRESS';
  return 'DRAFT';
}