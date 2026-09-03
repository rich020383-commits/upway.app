export type VerticalId = 'general' | 'health' | 'inmobiliaria' | 'retail' | 'supermercado' | 'drogueria';

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
  retail: 'retail',
  tienda: 'retail',
  tiendas: 'retail',
  supermercado: 'supermercado',
  supermercados: 'supermercado',
  drogueria: 'drogueria',
  droguerias: 'drogueria',
};

export const VERTICALS: Record<VerticalId, VerticalDefinition> = {
  general: {
    id: 'general',
    label: 'Negocio general',
    description: 'Configuración operativa adaptada a tu empresa.',
    onboardingRoute: '/dashboard/onboarding/lienzo?segment=general',
    miniLandingRoute: '/dashboard/onboarding',
  },
  health: {
    id: 'health',
    label: 'Clínica / Salud',
    description: 'Flujo clínico con triage, políticas y escalamiento humano.',
    onboardingRoute: '/health/onboarding',
    miniLandingRoute: '/industries/clinicas',
  },
  inmobiliaria: {
    id: 'inmobiliaria',
    label: 'Inmobiliaria',
    description: 'Captación, seguimiento comercial y agenda de visitas.',
    onboardingRoute: '/dashboard/onboarding/lienzo?segment=inmobiliaria',
    miniLandingRoute: '/industries/inmobiliarias',
  },
  retail: {
    id: 'retail',
    label: 'Retail / Tienda',
    description: 'Atención comercial más rápida y ventas más claras.',
    onboardingRoute: '/dashboard/onboarding/lienzo?segment=retail',
    miniLandingRoute: '/industries/tiendas',
  },
  supermercado: {
    id: 'supermercado',
    label: 'Supermercado',
    description: 'Consultas, promociones y atención con mayor velocidad.',
    onboardingRoute: '/dashboard/onboarding/lienzo?segment=supermercado',
    miniLandingRoute: '/industries/supermercados',
  },
  drogueria: {
    id: 'drogueria',
    label: 'Droguería',
    description: 'Consultas, disponibilidad y pedidos con mejor coordinación.',
    onboardingRoute: '/dashboard/onboarding/lienzo?segment=drogueria',
    miniLandingRoute: '/industries/droguerias',
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
  return VERTICALS[normalized]?.onboardingRoute ?? '/dashboard';
}

export const SEGMENT_ROUTE_MAP: Record<string, string> = {
  health: '/health/onboarding',
  salud: '/health/onboarding',
  clinica: '/health/onboarding',
  clinicas: '/health/onboarding',
  'clínicas': '/health/onboarding',
  inmobiliaria: '/dashboard/onboarding/lienzo?segment=inmobiliaria',
  inmobiliarias: '/dashboard/onboarding/lienzo?segment=inmobiliaria',
  retail: '/dashboard/onboarding/lienzo?segment=retail',
  tienda: '/dashboard/onboarding/lienzo?segment=retail',
  tiendas: '/dashboard/onboarding/lienzo?segment=retail',
  supermercado: '/dashboard/onboarding/lienzo?segment=supermercado',
  supermercados: '/dashboard/onboarding/lienzo?segment=supermercado',
  drogueria: '/dashboard/onboarding/lienzo?segment=drogueria',
  droguerias: '/dashboard/onboarding/lienzo?segment=drogueria',
  general: '/dashboard/onboarding/lienzo?segment=general',
  business: '/dashboard/onboarding/lienzo?segment=general',
  negocio: '/dashboard/onboarding/lienzo?segment=general',
};
