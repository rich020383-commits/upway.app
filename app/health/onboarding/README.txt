Health onboarding flow plan

Flujo vigente (panel unico /health, modelo white-glove: Upway implementa, el cliente opera):

1. clinic-setup          - Clinica: identidad operativa y contacto
2. plan-and-volume       - Plan: volumen y tarifa
3. specialty-and-care-model - Especialidad y modelo clinico
4. agent-profile         - Agente: perfil del asistente
5. triage-rules          - Triaje: reglas de clasificacion
6. tone-and-voice        - Tono y voz (la voz se elige en /health/production)
7. policies-and-escalation - Politicas de cancelacion y escalamiento
8. faq-content           - FAQ: respuestas frecuentes
9. channel-integration   - Canales: voz IA 24/7 + integraciones
10. review-and-approve   - Revision y aprobacion
11. go-live              - Activacion (checklist de entrega en /health/production)

Notas de estado (2026-09):
- Los pasos viven en lib/health/onboarding.ts (onboardingStages) y se persisten
  en HealthOnboardingSession via /api/health/onboarding.
- El go-live NO es automatico: lo habilita el checklist de /api/health/activate.
- Politica de canales: Upway NO usa ni integra WhatsApp ni Meta. El canal oficial
  es la voz IA sobre linea telefonica (ver lib/health/activation.ts).
- Onboarding de Inmobiliarias/Center: components/onboarding/vertical-wizard.tsx
  (validacion compartida en lib/onboarding/types.ts). Su persistencia en base de
  datos sigue PENDIENTE: hoy el caso se traza solo por correo.
