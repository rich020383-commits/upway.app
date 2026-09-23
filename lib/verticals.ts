export type VerticalId = 'general' | 'health' | 'inmobiliaria' | 'center' | 'retail' | 'supermercado' | 'drogueria';

export type VerticalDefinition = {
  id: VerticalId;
  label: string;
  description: string;
  onboardingRoute: string;
  miniLandingRoute: string;
};

const segmentAliases: Record<string, string> = {
  business: 'general',
  general: 'general',
  negocio: 'general',
  'negocio-general': 'general',
  salud: 'health',
  health: 'health',
  clinica: 'health',
  clinicas: 'health',
  'clínicas': 'health',
  inmobiliaria: 'inmobiliaria',
  inmobiliarias: 'inmobiliaria',
  center: 'center',
  'upway-center': 'center',
  callcenter: 'center',
  'call-center': 'center',
  retail: 'retail',
  tienda: 'retail',
  tiendas: 'retail',
  supermercado: 'supermercado',
  supermercados: 'supermercado',
  drogueria: 'drogueria',
  droguerias: 'drogueria',
};

/**
 * Verticales de Upway. Desde la consolidación, solo Health, Inmobiliarias y
 * Center tienen flujo propio de onboarding.
 *
 * `retail`, `supermercado`, `drogueria` y `general` se conservan porque el
 * registro/login y el contexto del negocio siguen etiquetando al cliente con
 * ellos, pero apuntan al panel único (/health): su onboarding v1 con SDK Meta
 * se retiró junto con el panel viejo /dashboard.
 */
export const VERTICALS: Record<VerticalId, VerticalDefinition> = {
  general: {
    id: 'general',
    label: 'Negocio general',
    description: 'Configuración operativa adaptada a tu empresa.',
    onboardingRoute: '/health',
    miniLandingRoute: '/',
  },
  health: {
    id: 'health',
    label: 'Clínica / Salud',
    description: 'Flujo clínico con triage, políticas y escalamiento humano.',
    onboardingRoute: '/health/onboarding',
    miniLandingRoute: '/',
  },
  inmobiliaria: {
    id: 'inmobiliaria',
    label: 'Inmobiliaria',
    description: 'Captación, seguimiento comercial y agenda de visitas.',
    onboardingRoute: '/inmobiliarias/onboarding',
    miniLandingRoute: '/',
  },
  center: {
    id: 'center',
    label: 'Upway Center',
    description: 'Call center: servicio técnico y atención al cliente 24/7.',
    onboardingRoute: '/center/onboarding',
    miniLandingRoute: '/center',
  },
  retail: {
    id: 'retail',
    label: 'Retail / Tienda',
    description: 'Atención comercial más rápida y ventas más claras.',
    onboardingRoute: '/health',
    miniLandingRoute: '/',
  },
  supermercado: {
    id: 'supermercado',
    label: 'Supermercado',
    description: 'Consultas, promociones y atención con mayor velocidad.',
    onboardingRoute: '/health',
    miniLandingRoute: '/',
  },
  drogueria: {
    id: 'drogueria',
    label: 'Droguería',
    description: 'Consultas, disponibilidad y pedidos con mejor coordinación.',
    onboardingRoute: '/health',
    miniLandingRoute: '/',
  },
};

export function normalizeSegment(value?: string | null): VerticalId {
  const raw = (value ?? 'general').trim().toLowerCase();
  const mapped = segmentAliases[raw] ?? raw;

  if (mapped in VERTICALS) {
    return mapped as VerticalId;
  }

  return 'general';
}

export function resolveVertical(value?: string | null): VerticalDefinition {
  return VERTICALS[normalizeSegment(value)];
}

export function resolvePostLoginRoute(value?: string | null): string {
  const normalized = normalizeSegment(value);
  // Fallback: el panel único de Upway. /dashboard ya no existe (301 a /health).
  return VERTICALS[normalized]?.onboardingRoute ?? '/health';
}

/**
 * Mapa de entrada por segmento. Se mantiene porque los enlaces antiguos
 * (`?segment=retail`, etc.) siguen llegando desde correos y campañas: los
 * segmentos sin flujo propio aterrizan en el panel único en lugar de una
 * ruta inexistente.
 */
export const SEGMENT_ROUTE_MAP: Record<string, string> = {
  health: '/health/onboarding',
  salud: '/health/onboarding',
  clinica: '/health/onboarding',
  clinicas: '/health/onboarding',
  'clínicas': '/health/onboarding',
  inmobiliaria: '/inmobiliarias/onboarding',
  inmobiliarias: '/inmobiliarias/onboarding',
  center: '/center/onboarding',
  'upway-center': '/center/onboarding',
  callcenter: '/center/onboarding',
  'call-center': '/center/onboarding',
  retail: '/health',
  tienda: '/health',
  tiendas: '/health',
  supermercado: '/health',
  supermercados: '/health',
  drogueria: '/health',
  droguerias: '/health',
  general: '/health',
  business: '/health',
  negocio: '/health',
};
