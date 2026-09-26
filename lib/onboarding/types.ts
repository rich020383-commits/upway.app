import { validateEmail, validateRequired } from '@/lib/validation';

/** Tipos del motor de onboarding vertical (patrón del wizard de Health). */

export type VerticalSegment = 'inmobiliaria' | 'center';

/**
 * Carpeta de rutas de cada segmento en `app/`.
 *
 * NO coincide con el segmento: el id es `inmobiliaria` (singular, así está en
 * la base de datos y en la API) pero la carpeta es `/inmobiliarias` (plural).
 * Construir la URL como `/${segment}` daba /inmobiliaria/caso → 404. Se centraliza
 * aquí para que ningún enlace vuelva a adivinarlo.
 */
export const VERTICAL_BASE_PATH: Record<VerticalSegment, string> = {
  inmobiliaria: '/inmobiliarias',
  center: '/center',
};

/** Ruta base pública de una vertical. */
export function verticalBasePath(segment: VerticalSegment): string {
  return VERTICAL_BASE_PATH[segment] ?? '/';
}

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

/** Etiqueta pública de cada vertical, para el guion del asistente. */
export const VERTICAL_LABEL: Record<VerticalSegment, string> = {
  inmobiliaria: 'Agente inmobiliario',
  center: 'Agente de servicio y atención',
};

/** Lee el JSON de respuestas del wizard a un objeto plano de strings. */
export function parseWizardAnswers(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Arma las instrucciones iniciales del agente con lo que el cliente ya
 * respondió en el wizard.
 *
 * No es una plantilla genérica: recoge sus palabras. El cliente puede editarlo
 * después desde el panel, pero arrancar con lo que él escribió —y no con una
 * caja vacía ni con un texto de Upway que no reconoce— es la diferencia entre
 * un producto suyo y un formulario.
 *
 * Si falta lo esencial, devuelve un texto mínimo honesto en vez de inventar
 * reglas: es preferible un prompt pobre que uno que prometa cosas que el negocio
 * no pidió.
 */
export function buildPromptFromAnswers(
  segment: VerticalSegment,
  answersRaw: string | null | undefined
): string {
  const a = parseWizardAnswers(answersRaw);
  const negocio = (a.empresa ?? '').trim();
  const lineas: string[] = [];

  lineas.push(
    `Sos el agente de voz de ${negocio || 'una inmobiliaria o un centro de servicio'}. Atendés llamadas en español de Colombia.`
  );

  const tarea = (a.tarea ?? '').trim();
  if (segment === 'inmobiliaria') {
    lineas.push(
      tarea
        ? `Tu trabajo: ${tarea}.`
        : 'Tu trabajo: calificar al interesado y agendar la visita sobre la operación real del negocio.'
    );
    const zona = (a.inmuebles ?? '').trim();
    if (zona) lineas.push(`Zonas o tipos de inmueble que atendés: ${zona}.`);
    const volumen = (a.volumen ?? '').trim();
    if (volumen) lineas.push(`Volumen esperado: ${volumen}.`);
  } else {
    lineas.push(
      tarea
        ? `Tu trabajo: ${tarea}.`
        : 'Tu trabajo: resolver la consulta del cliente y escalar al equipo lo que no puedas.'
    );
    const lineaServicio = (a.linea ?? '').trim();
    if (lineaServicio) lineas.push(`Línea de servicio que atendés: ${lineaServicio}.`);
    const minutos = (a.minutos ?? '').trim();
    if (minutos) lineas.push(`Volumen esperado: ${minutos}.`);
  }

  const horario = (a.horario ?? '').trim();
  if (horario) lineas.push(`Horario de atención: ${horario}.`);

  const faqs = (a.faqs ?? '').trim();
  if (faqs) lineas.push(`Preguntas frecuentes ya resueltas:\n${faqs}`);

  const equipo = (a.equipo ?? '').trim();
  if (equipo) lineas.push(`Escalá a: ${equipo}.`);

  const encargado = (a.encargado ?? '').trim();
  if (encargado) lineas.push(`Responsable del proyecto: ${encargado}.`);

  const ciudad = (a.ciudad ?? '').trim();
  if (ciudad) lineas.push(`Ciudad: ${ciudad}.`);

  lineas.push('');
  lineas.push('Reglas que no se negocian:');
  lineas.push('- Confirmá los datos del cliente leyendo dígito por dígito antes de agendar.');
  lineas.push('- No prometas precios, descuentos, financiamientos ni plazos que no estén en este texto.');
  lineas.push('- Si el cliente pide hablar con una persona, cedés el paso de inmediato.');
  lineas.push('- Si no sabés la respuesta, decí que lo confirmás y transferís. Nunca inventes.');

  return lineas.join('\n');
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

/**
 * Filas legibles (etiqueta → valor) de todo el envío, en el orden del wizard.
 *
 * Es la fuente del correo interno de revisión: sin esto, el equipo de Upway
 * recibía el caso sin saber a qué campo correspondía cada respuesta.
 */
export function submissionRows(
  config: OnboardingConfig,
  answers: Record<string, string>
): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const mapped = new Set<string>();

  for (const stage of config.stages) {
    for (const field of stage.fields ?? []) {
      mapped.add(field.id);
      const value = (answers[field.id] ?? '').trim();
      if (value) rows.push([field.label, value]);
    }
  }

  // Respuestas fuera del catálogo de campos (p. ej. quedó de una versión previa
  // del wizard) no se pierden: se anexan con su id como etiqueta.
  for (const [id, raw] of Object.entries(answers)) {
    if (mapped.has(id) || id === 'planId') continue;
    const value = (raw ?? '').trim();
    if (value) rows.push([id, value]);
  }

  return rows;
}

/** Nombre legible del plan elegido; si no se resuelve, devuelve el id crudo. */
export function submissionPlanName(
  config: OnboardingConfig,
  answers: Record<string, string>
): string {
  const planId = (answers.planId ?? '').trim();
  if (!planId) return '';
  const plans = config.stages.flatMap((stage) => [...(stage.plans ?? [])]);
  return plans.find((plan) => plan.id === planId)?.name ?? planId;
}

/** Nombre de la organización tal como lo escribió el cliente. */
export function submissionCompanyName(answers: Record<string, string>): string {
  return (answers.empresa ?? '').trim();
}