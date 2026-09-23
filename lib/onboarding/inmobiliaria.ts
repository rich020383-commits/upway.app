import { STANDARD_INMOB_PLANS } from '@/lib/inmobiliaria/plans';
import type { OnboardingConfig, WizardStage } from './types';

/**
 * Onboarding de Upway Inmobiliarias — wizard tipo Health (v2).
 * Reemplaza al flujo viejo /dashboard/onboarding (v1: módulos + SDK Meta).
 */
export const INMOBILIARIA_STAGES: readonly WizardStage[] = [
  {
    id: 'empresa',
    eyebrow: 'EMPRESA',
    titulo: 'Cuéntanos sobre tu inmobiliaria',
    intro: 'Estos datos identifican tu operación y con quién validamos la activación.',
    fields: [
      { id: 'empresa', label: 'Nombre de la inmobiliaria', placeholder: 'Ej. Inmobiliaria Norte' },
      { id: 'ciudad', label: 'Ciudad o zona', placeholder: 'Bogotá' },
      { id: 'encargado', label: 'Encargado del proyecto', placeholder: 'Nombre y cargo' },
      {
        id: 'contactoEmail',
        label: 'Correo de contacto',
        kind: 'email',
        placeholder: 'contacto@inmobiliaria.com',
        help: 'Ahí te confirmamos la activación y el link de pago.',
      },
      { id: 'contacto', label: 'Teléfono de contacto', kind: 'tel', placeholder: '+57 300 000 0000' },
    ],
  },
  {
    id: 'volumen',
    eyebrow: 'VOLUMEN',
    titulo: '¿Cuántas consultas atiendes al mes?',
    intro: 'Con esto ajustamos el plan a tu operación real; luego podrás cambiarlo.',
    fields: [
      {
        id: 'volumen',
        label: 'Consultas al mes',
        kind: 'select',
        options: [
          'Menos de 50 consultas/mes',
          '50–200 consultas/mes',
          '200–500 consultas/mes',
          'Más de 500 consultas/mes',
        ],
      },
    ],
  },
  {
    id: 'plan',
    eyebrow: 'PLAN',
    titulo: 'Elige tu plan',
    intro:
      'Precios finales en COP, con implementación única. Si tu operación no encaja en ninguno, lo cotizamos aparte.',
    plans: STANDARD_INMOB_PLANS,
  },
  {
    id: 'operacion',
    eyebrow: 'OPERACIÓN',
    titulo: 'Qué debe resolver el agente',
    intro: 'Define el alcance de la atención para que el agente no se salga de lo acordado.',
    fields: [
      {
        id: 'inmuebles',
        label: 'Zonas o tipos de inmuebles que atiendes',
        placeholder: 'Ej. Chapinero y Usaquén; apartamentos y casas',
      },
      {
        id: 'tarea',
        label: 'Qué debe hacer el agente',
        kind: 'select',
        options: [
          'Agendar visitas y asesorías',
          'Consultar disponibilidad de inmuebles',
          'Estado de arriendos y contratos',
          'Consultas generales + agendamiento',
        ],
      },
      { id: 'horario', label: 'Horario de atención', placeholder: 'Lun a Sáb 8:00–18:00' },
    ],
  },
  {
    id: 'conocimiento',
    eyebrow: 'CONOCIMIENTO',
    titulo: 'Preguntas frecuentes y datos aprobados',
    intro:
      'Si una respuesta no está aquí o en tu catálogo, el agente escala a tu equipo en lugar de inventar. Así el servicio queda honesto y auditable.',
    fields: [
      {
        id: 'faqs',
        label: '5 preguntas frecuentes de tus clientes',
        kind: 'textarea',
        placeholder: '¿Agendan visitas sin cita? ¿Manejan arriendo directo? ¿Cuánto demora la respuesta…?',
        help: 'Una pregunta por línea.',
      },
    ],
  },
  {
    id: 'integracion',
    eyebrow: 'INTEGRACIÓN',
    titulo: 'Cómo lo conectamos',
    fields: [
      {
        id: 'integracion',
        label: 'Integración',
        kind: 'select',
        options: [
          'Solo llamadas y mensajes (recomendado)',
          'Integración con nuestro CRM',
          'Aún no lo definimos',
        ],
      },
    ],
  },
  {
    id: 'resumen',
    eyebrow: 'REVISIÓN',
    titulo: 'Revisa y envía a revisión',
    intro:
      'Upway revisa la configuración antes de activar. Te contactamos para confirmar el número, el guion y la fecha de arranque.',
  },
];

export const INMOBILIARIA_ONBOARDING: OnboardingConfig = {
  segment: 'inmobiliaria',
  label: 'Inmobiliarias',
  stages: INMOBILIARIA_STAGES,
};