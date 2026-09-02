export const onboardingStages = [
  'clinic-setup',
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
      return 'ACTIVE';
    case 'review-and-approve':
    case 'channel-integration':
      return 'PENDING_REVIEW';
    case 'faq-content':
    case 'policies-and-escalation':
    case 'triage-rules':
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
    label: 'Clínica',
    subtitle: 'Perfil y ubicación',
    description: 'Define la identidad operativa y el contexto de la clínica.',
  },
  'specialty-and-care-model': {
    label: 'Especialidad',
    subtitle: 'Modelo clínico',
    description: 'Configura la especialidad, horarios y flujo de atención.',
  },
  'agent-profile': {
    label: 'Agente',
    subtitle: 'Perfil del asistente',
    description: 'Asigna la voz, la misión y la esfera de responsabilidad del agente.',
  },
  'triage-rules': {
    label: 'Triaje',
    subtitle: 'Reglas de clasificación',
    description: 'Determina cómo prioriza, redirige y escalará el agente.',
  },
  'tone-and-voice': {
    label: 'Tono',
    subtitle: 'Voz y marca',
    description: 'Establece el estilo verbal y la empatía del agente.',
  },
  'policies-and-escalation': {
    label: 'Políticas',
    subtitle: 'Cancelación y escalamiento',
    description: 'Define las reglas de cancelación, escalas y excepciones.',
  },
  'faq-content': {
    label: 'FAQ',
    subtitle: 'Preguntas frecuentes',
    description: 'Carga la base de respuestas para la atención frecuente.',
  },
  'channel-integration': {
    label: 'Canales',
    subtitle: 'WhatsApp y Vapi',
    description: 'Conecta los canales de atención y los registros de emisión.',
  },
  'review-and-approve': {
    label: 'Revisión',
    subtitle: 'Aprobación final',
    description: 'Revisa el setup completo antes de activation.',
  },
  'go-live': {
    label: 'Go-live',
    subtitle: 'Activación',
    description: 'Publica la clínica en producción con control incremental.',
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
    subtitle: 'Configuración',
    description: 'Detalle no definido para la etapa actual.',
  };
}
