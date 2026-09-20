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
  /** Plan comercial elegido en onboarding (id). */
  planId?: string | null;
  /** Plan auto-activable (false = EPS custom / deal desk). */
  planAutoActivatable?: boolean;
  /** Intake de implementacion completo (NIT, contacto, volumen). */
  implementationIntakeReady?: boolean;
  /** WhatsApp solo gatea el go-live si el cliente contrato ese canal (voz-first). */
  whatsappRequired?: boolean;
  /** Servicios de la IPS que exigen documento del paciente (denominador). */
  identityServicesRequiringDocs?: number;
  /** Cuantos de esos ya tienen tipo de documento del catalogo cerrado. */
  identityServicesWithCatalogType?: number;
};

export function buildActivationChecks(input: ActivationInput): { checks: ActivationCheck[]; canActivate: boolean } {
  const planOk =
    Boolean(input.planId) &&
    input.planAutoActivatable !== false &&
    input.implementationIntakeReady !== false;

  // Voz-first (nuestro modelo): WhatsApp solo gatea si el cliente contrato ese canal.
  const whatsappRequired = input.whatsappRequired !== false;

  // Identidad conforme: si un servicio exige documento, debe tener tipo del
  // catalogo cerrado (Res. 866/2021). Sin eso el agente de voz no sabe que pedir
  // y el registro que sale hacia el prestador no es conforme.
  const servicesRequiringDocs = input.identityServicesRequiringDocs ?? 0;
  const servicesWithCatalogType = input.identityServicesWithCatalogType ?? 0;
  const identityOk = servicesRequiringDocs === 0 || servicesWithCatalogType >= servicesRequiringDocs;

  const checks: ActivationCheck[] = [
    {
      key: 'tenant',
      label: 'Tenant IPS (organizacion + clinica + workspace)',
      ok: input.hasOrganization && input.hasClinic && input.hasTienda,
      detail: input.hasOrganization && input.hasClinic && input.hasTienda
        ? 'Tenant real vinculado.'
        : 'Falta organizacion, clinica o workspace vinculados al dueno.',
    },
    {
      key: 'plan',
      label: 'Plan comercial + intake de implementacion',
      ok: planOk,
      detail: !input.planId
        ? 'Sin plan elegido en onboarding.'
        : input.planAutoActivatable === false
          ? 'Plan custom/EPS: requiere deal desk + approval Telnyx (no auto-activar).'
          : input.implementationIntakeReady === false
            ? 'Faltan datos de implementacion (NIT, contacto, volumen).'
            : 'Plan ' + input.planId + ' listo para entrega white-glove.',
    },
    {
      key: 'clinical-data',
      label: 'Datos clinicos del onboarding (triaje + politicas + FAQs)',
      ok: input.triageCount > 0 && input.policiesCount > 0,
      detail: input.triageCount + ' triaje · ' + input.policiesCount + ' politicas · ' + input.faqsCount + ' FAQs',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp conectado (Meta)',
      ok: !whatsappRequired || input.whatsappActive,
      detail: !whatsappRequired
        ? 'Canal no contratado: no aplica para este go-live (despliegue voz-first).'
        : input.whatsappActive
          ? 'Linea Meta activa.'
          : 'Upway debe conectar OAuth Meta y guardar metaPhoneNumberId.',
    },
    {
      key: 'voice',
      label: 'Voz Telnyx dedicada (assistant + numero)',
      ok: input.voiceActive && input.hasAssistant && input.hasPhone,
      detail:
        input.voiceActive && input.hasAssistant && input.hasPhone
          ? 'Assistant + numero dedicado activos.'
          : 'Upway debe crear AI Assistant y asignar numero dedicado de la IPS.',
    },
    {
      key: 'approval',
      label: 'Aprobacion clinica + estado onboarding',
      ok: input.clinicallyApproved && ['APPROVED', 'ACTIVE'].includes(input.onboardingStatus ?? ''),
      detail: 'Onboarding: ' + (input.onboardingStatus ?? 'sin sesion') + ' · aprobacion: ' + (input.clinicallyApproved ? 'si' : 'pendiente'),
    },
  ];

  // Identidad conforme: es el nucleo de lo que vende Upway (voz + dato conforme),
  // por eso gatea el go-live igual que los canales o la aprobacion clinica.
  checks.push({
    key: 'identity',
    label: 'Identidad conforme (tipo de documento de catalogo cerrado)',
    ok: identityOk,
    detail:
      servicesRequiringDocs === 0
        ? 'Sin servicios que exijan documento: no hay captura conforme pendiente.'
        : identityOk
          ? servicesWithCatalogType + ' de ' + servicesRequiringDocs + ' servicios con documento ya exigen un tipo del catalogo (Res. 866/2021).'
          : 'Hay servicios que exigen documento sin tipo del catalogo: el agente no sabria que pedir y el registro saldria no conforme.',
  });

  return { checks, canActivate: checks.every((c) => c.ok) };
}
