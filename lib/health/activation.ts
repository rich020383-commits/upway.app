export type ActivationCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type ActivationInput = {
  hasOrganization: boolean;
  hasClinic: boolean;
  hasTienda: boolean;
  onboardingStatus: string | null;
  whatsappActive: boolean;
  voiceActive: boolean;
  hasAssistant: boolean;
  hasPhone: boolean;
  triageCount: number;
  policiesCount: number;
  faqsCount: number;
  clinicallyApproved: boolean;
};

export function buildActivationChecks(input: ActivationInput): { checks: ActivationCheck[]; canActivate: boolean } {
  const checks: ActivationCheck[] = [
    {
      key: 'tenant',
      label: 'Tenant IPS (organización + clínica + workspace)',
      ok: input.hasOrganization && input.hasClinic && input.hasTienda,
      detail: input.hasOrganization && input.hasClinic && input.hasTienda
        ? 'Tenant real vinculado.'
        : 'Falta organización, clínica o workspace vinculados al dueño.',
    },
    {
      key: 'clinical-data',
      label: 'Datos clínicos del onboarding (triaje + políticas + FAQs)',
      ok: input.triageCount > 0 && input.policiesCount > 0,
      detail: `${input.triageCount} triaje · ${input.policiesCount} políticas · ${input.faqsCount} FAQs`,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp conectado (Meta)',
      ok: input.whatsappActive,
      detail: input.whatsappActive ? 'Línea Meta activa.' : 'Upway debe conectar OAuth Meta y guardar metaPhoneNumberId.',
    },
    {
      key: 'voice',
      label: 'Voz Telnyx dedicada (assistant + número)',
      ok: input.voiceActive && input.hasAssistant && input.hasPhone,
      detail:
        input.voiceActive && input.hasAssistant && input.hasPhone
          ? 'Assistant + número dedicado activos.'
          : 'Upway debe crear AI Assistant y asignar número dedicado de la IPS.',
    },
    {
      key: 'approval',
      label: 'Aprobación clínica + estado onboarding',
      ok: input.clinicallyApproved && ['APPROVED', 'ACTIVE'].includes(input.onboardingStatus ?? ''),
      detail: `Onboarding: ${input.onboardingStatus ?? 'sin sesión'} · aprobación: ${input.clinicallyApproved ? 'sí' : 'pendiente'}`,
    },
  ];

  return { checks, canActivate: checks.every((c) => c.ok) };
}
