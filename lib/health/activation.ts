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
  /** @deprecated Canal de mensajeria legacy: ignorado (el canal oficial es la voz). */
  legacyMessagingActive?: boolean;
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
  /**
   * Datos clinicos escritos en el propio wizard de onboarding (texto libre):
   * el cliente los captura ahi, no en los modulos de Operaciones.
   */
  wizardTriage?: boolean;
  wizardPolicies?: boolean;
  wizardFaqs?: boolean;
  /** @deprecated Campo legacy: el gate se retiro, nunca bloquea el go-live. */
  legacyMessagingRequired?: boolean;
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

  // La mensajeria de terceros no gatea el go-live: por politica interna Upway
  // no la usa ni la integra. El canal oficial es la voz IA sobre linea
  // telefonica (ver el check informativo mas abajo).

  // Identidad conforme: si un servicio exige documento, debe tener tipo del
  // catalogo cerrado (Res. 866/2021). Sin eso el agente de voz no sabe que pedir
  // y el registro que sale hacia el prestador no es conforme.
  const servicesRequiringDocs = input.identityServicesRequiringDocs ?? 0;
  const servicesWithCatalogType = input.identityServicesWithCatalogType ?? 0;
  const identityOk = servicesRequiringDocs === 0 || servicesWithCatalogType >= servicesRequiringDocs;

  // Datos clinicos: sirve el registro estructurado de Operaciones O el texto que
  // el cliente escribio en el wizard de onboarding.
  const triageOk = input.triageCount > 0 || input.wizardTriage === true;
  const policiesOk = input.policiesCount > 0 || input.wizardPolicies === true;
  const clinicalOk = triageOk && policiesOk;
  const clinicalFromWizard =
    clinicalOk && (input.wizardTriage === true || input.wizardPolicies === true);
  const clinicalDetail =
    input.triageCount +
    ' triaje · ' +
    input.policiesCount +
    ' politicas · ' +
    input.faqsCount +
    ' FAQs' +
    (clinicalFromWizard ? ' (triaje/politicas tomados del onboarding)' : '');

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
          ? 'Plan custom/EPS: requiere deal desk + aprobacion de Upway (no auto-activar).'
          : input.implementationIntakeReady === false
            ? 'Faltan datos de implementacion (NIT, contacto, volumen).'
            : 'Plan ' + input.planId + ' listo para entrega white-glove.',
    },
    {
      key: 'clinical-data',
      label: 'Datos clinicos del onboarding (triaje + politicas + FAQs)',
      ok: clinicalOk,
      detail: clinicalDetail,
    },
    {
      key: 'channel-policy',
      label: 'Canal oficial de atencion (voz IA)',
      ok: true,
      detail:
        'La mensajeria de terceros no aplica: por politica interna Upway no la usa ni la integra. El canal oficial es la voz IA sobre linea telefonica.',
      // Check informativo: nunca bloquea el go-live.
      // (antes: este check gateaba el go-live con la linea del cliente.)
      // (antes: el cliente debia aportar credenciales propias.)
    },
    {
      key: 'voice',
      label: 'Voz dedicada de Upway (numero + asistente)',
      ok: input.voiceActive && input.hasAssistant && input.hasPhone,
      detail:
        input.voiceActive && input.hasAssistant && input.hasPhone
          ? 'Asistente y numero dedicado activos.'
          : 'Upway debe crear el asistente de voz y asignar el numero dedicado de la IPS.',
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
