export const onboardingStages = [
  'clinic-setup',
  'plan-and-volume',
  'specialty-and-care-model',
  'agent-profile',
  'triage-rules',
  'tone-and-voice',
  'policies-and-escalation',
  'faq-content',
  'channel-integration',
  'review-and-approve',
  'go-live',
] as const;

export type OnboardingStage = (typeof onboardingStages)[number];

export type HealthOnboardingStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'APPROVED'
  | 'TESTING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'BLOCKED'
  | 'ARCHIVED';

export function getHealthStatusForStage(step: string): HealthOnboardingStatus {
  switch (step) {
    case 'go-live':
      return 'PENDING_REVIEW';
    case 'review-and-approve':
    case 'channel-integration':
      return 'PENDING_REVIEW';
    case 'faq-content':
    case 'policies-and-escalation':
    case 'triage-rules':
    case 'plan-and-volume':
      return 'IN_PROGRESS';
    default:
      return 'DRAFT';
  }
}

export const onboardingStageMeta: Record<
  OnboardingStage,
  { label: string; subtitle: string; description: string }
> = {
  'clinic-setup': {
    label: 'Clinica',
    subtitle: 'Perfil y ubicacion',
    description: 'Define la identidad operativa, razon social y contacto de implementacion.',
  },
  'plan-and-volume': {
    label: 'Plan',
    subtitle: 'Volumen y tarifa',
    description: 'Estima llamadas, elige plan honesto y deja listo el intake para Upway.',
  },
  'specialty-and-care-model': {
    label: 'Especialidad',
    subtitle: 'Modelo clinico',
    description: 'Configura la especialidad, horarios y flujo de atencion.',
  },
  'agent-profile': {
    label: 'Agente',
    subtitle: 'Perfil del asistente',
    description: 'Asigna la voz, la mision y la esfera de responsabilidad del agente.',
  },
  'triage-rules': {
    label: 'Triaje',
    subtitle: 'Reglas de clasificacion',
    description: 'Determina como prioriza, redirige y escalara el agente.',
  },
  'tone-and-voice': {
    label: 'Tono',
    subtitle: 'Voz y marca',
    description: 'Establece el estilo verbal y la empatia del agente.',
  },
  'policies-and-escalation': {
    label: 'Politicas',
    subtitle: 'Cancelacion y escalamiento',
    description: 'Define las reglas de cancelacion, escalas y excepciones.',
  },
  'faq-content': {
    label: 'FAQ',
    subtitle: 'Preguntas frecuentes',
    description: 'Carga la base de respuestas para la atencion frecuente.',
  },
  'channel-integration': {
    label: 'Canales',
    subtitle: 'WhatsApp y voz',
    description: 'Upway conecta WhatsApp y voz dedicada con el numero de la clinica.',
  },
  'review-and-approve': {
    label: 'Revision',
    subtitle: 'Aprobacion final',
    description: 'Revisa plan + setup clinico antes de la implementacion Upway.',
  },
  'go-live': {
    label: 'Go-live',
    subtitle: 'Activacion',
    description: 'Publica la clinica en produccion cuando el checklist de entrega este verde.',
  },
};

export function getOnboardingStageIndex(stage: string) {
  return onboardingStages.indexOf(stage as OnboardingStage);
}

export function getOnboardingStageStatus(currentStage: string, targetStage: string) {
  const currentIndex = getOnboardingStageIndex(currentStage);
  const targetIndex = getOnboardingStageIndex(targetStage);

  if (currentIndex === -1 || targetIndex === -1) return 'pending';
  if (targetIndex < currentIndex) return 'done';
  if (targetIndex === currentIndex) return 'active';
  return 'pending';
}

export function getOnboardingStageMeta(stage: string) {
  const normalized = stage as OnboardingStage;
  return onboardingStageMeta[normalized] ?? {
    label: 'Etapa',
    subtitle: 'Configuracion',
    description: 'Detalle no definido para la etapa actual.',
  };
}
