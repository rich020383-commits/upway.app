import { STANDARD_CENTER_PLANS } from '@/lib/center/plans';
import type { OnboardingConfig, WizardStage } from './types';

/**
 * Onboarding de Upway Center — wizard tipo Health (v2).
 * El flujo viejo /dashboard/onboarding era genérico y mezclaba SDK Meta;
 * este wizard cubre servicio técnico y atención al cliente con límites honestos.
 */
export const CENTER_STAGES: readonly WizardStage[] = [
  {
    id: 'empresa',
    eyebrow: 'EMPRESA',
    titulo: 'Cuéntanos de tu operación',
    intro: 'Estos datos identifican tu empresa y con quién validamos la activación.',
    fields: [
      { id: 'empresa', label: 'Nombre de la empresa', placeholder: 'Ej. ServiTech' },
      { id: 'ciudad', label: 'Ciudad o zona', placeholder: 'Medellín' },
      { id: 'contacto', label: 'Teléfono de contacto', kind: 'tel', placeholder: '+57 300 000 0000' },
    ],
  },
  {
    id: 'volumen',
    eyebrow: 'VOLUMEN',
    titulo: '¿Cuántos minutos de llamada manejas al mes?',
    intro: 'Con esto ajustamos el plan a tu volumen real de llamadas entrantes.',
    fields: [
      {
        id: 'volumen',
        label: 'Minutos de llamada al mes',
        kind: 'select',
        options: [
          'Menos de 1.000 min/mes',
          '1.000–3.000 min/mes',
          '3.000–6.000 min/mes',
          'Más de 6.000 min/mes',
        ],
      },
    ],
  },
  {
    id: 'plan',
    eyebrow: 'PLAN',
    titulo: 'Elige tu plan',
    intro:
      'Precios finales en COP, con implementación única. Algunos planes requieren aprobación de la operadora telefónica; te avisamos al momento de activar.',
    plans: STANDARD_CENTER_PLANS,
  },
  {
    id: 'servicio',
    eyebrow: 'SERVICIO',
    titulo: '¿Qué línea de servicio activas?',
    intro: 'Upway Center atiende servicio técnico y atención al cliente; define por dónde empiezas.',
    fields: [
      {
        id: 'linea',
        label: 'Línea de servicio',
        kind: 'select',
        options: ['Servicio técnico', 'Atención al cliente', 'Ambas líneas'],
      },
      {
        id: 'horario',
        label: 'Horario de atención de las llamadas',
        kind: 'select',
        options: ['24/7', 'Lun–Vie 8:00–18:00', 'Sábados 9:00–14:00', 'Otro horario definido'],
      },
    ],
  },
  {
    id: 'conocimiento',
    eyebrow: 'CONOCIMIENTO',
    titulo: 'Qué resuelve el agente y qué escala a tu equipo',
    intro:
      'Escribe el guion y las preguntas frecuentes. Si algo no está aquí, el agente escala con contexto en lugar de inventar una respuesta.',
    fields: [
      {
        id: 'guion',
        label: 'Guion del agente (qué debe resolver y qué nunca debe prometer)',
        kind: 'textarea',
        placeholder:
          'Saluda, identifica el caso, consulta por número de orden, agenda visita técnica… Nunca prometa fechas sin consultar.',
      },
      {
        id: 'faqs',
        label: '5 preguntas frecuentes',
        kind: 'textarea',
        placeholder: '¿Cuánto demora la reparación? ¿Tienen cobertura en mi ciudad? …',
        help: 'Una pregunta por línea.',
      },
    ],
  },
  {
    id: 'escalamiento',
    eyebrow: 'ESCALAMIENTO',
    titulo: 'A dónde escala cuando el agente no puede resolver',
    fields: [
      { id: 'equipo', label: 'Equipo o persona que recibe la escalamiento', placeholder: 'Ej. Soporte N2 / Encargado de soporte' },
      {
        id: 'numero',
        label: 'Número telefónico',
        kind: 'select',
        options: ['Necesito un número nuevo', 'Ya tenemos número que redirigimos'],
      },
    ],
  },
  {
    id: 'resumen',
    eyebrow: 'REVISIÓN',
    titulo: 'Revisa y envía a revisión',
    intro:
      'Upway revisa la configuración antes de activar. Te contactamos para confirmar el número, la redirección y la fecha de arranque.',
  },
];

export const CENTER_ONBOARDING: OnboardingConfig = {
  segment: 'center',
  label: 'Upway Center',
  stages: CENTER_STAGES,
};