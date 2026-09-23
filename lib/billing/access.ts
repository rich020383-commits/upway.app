/**
 * Fuente única del estado de acceso del workspace (facturación → acceso).
 * El gate que lo aplica vive en `proxy.ts` (Next 16 renombró middleware a proxy).
 * Los códigos promocionales del panel viejo se retiraron con él.
 */
export type BillingState =
  | 'trial'
  | 'pending_payment'
  | 'active'
  | 'paused'
  | 'suspended'
  | 'cancelled';

export const billingStateMeta: Record<
  BillingState,
  {
    label: string;
    tone: 'neutral' | 'warning' | 'success' | 'danger';
    canAccessDashboard: boolean;
    requiresCheckout: boolean;
    summary: string;
  }
> = {
  trial: {
    label: 'Prueba activa',
    tone: 'neutral',
    canAccessDashboard: true,
    requiresCheckout: false,
    summary: 'El workspace está en una prueba operativa con acceso funcional autorizado.',
  },
  pending_payment: {
    label: 'Pago pendiente',
    tone: 'warning',
    canAccessDashboard: false,
    requiresCheckout: true,
    summary: 'La cuenta aún necesita confirmación de pago para activar el acceso completo.',
  },
  active: {
    label: 'Activo',
    tone: 'success',
    canAccessDashboard: true,
    requiresCheckout: false,
    summary: 'El acceso está activo y la operación puede trabajar sin bloqueos.',
  },
  paused: {
    label: 'En pausa',
    tone: 'warning',
    canAccessDashboard: false,
    requiresCheckout: false,
    summary: 'La cuenta está pausada por decisión operativa o de billing.',
  },
  suspended: {
    label: 'Suspendido',
    tone: 'danger',
    canAccessDashboard: false,
    requiresCheckout: true,
    summary: 'El acceso fue suspendido por riesgo, impago o revisión manual.',
  },
  cancelled: {
    label: 'Cancelado',
    tone: 'danger',
    canAccessDashboard: false,
    requiresCheckout: true,
    summary: 'El workspace ya no tiene acceso a producción y debe reactivarse manualmente.',
  },
};

export function resolveBillingState(input?: string | null): BillingState {
  const normalized = String(input ?? 'trial').trim().toLowerCase();

  if (!normalized || normalized === 'trial' || normalized.includes('demo') || normalized.includes('eval')) {
    return 'trial';
  }

  if (normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('review')) {
    return 'pending_payment';
  }

  if (normalized.includes('paused') || normalized.includes('hold')) {
    return 'paused';
  }

  if (normalized.includes('suspend') || normalized.includes('blocked') || normalized.includes('risk')) {
    return 'suspended';
  }

  if (normalized.includes('cancel') || normalized.includes('closed') || normalized.includes('inactive')) {
    return 'cancelled';
  }

  if (normalized.includes('active') || normalized.includes('pro') || normalized.includes('premium')) {
    return 'active';
  }

  return 'trial';
}
