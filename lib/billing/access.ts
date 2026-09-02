export type BillingState =
  | 'trial'
  | 'pending_payment'
  | 'active'
  | 'paused'
  | 'suspended'
  | 'cancelled';

export type AccessCodeDefinition = {
  label: string;
  description: string;
  state: BillingState;
  type: 'trial' | 'gift' | 'invite';
  expiresInDays?: number;
};

export const builtInAccessCodes: Record<string, AccessCodeDefinition> = {
  'UPWAY-TRIAL': {
    label: 'Prueba Upway',
    description: 'Acceso de prueba para evaluación inicial del workspace.',
    state: 'trial',
    type: 'trial',
    expiresInDays: 14,
  },
  'CLINICA-SELECTA': {
    label: 'Cliente selecto',
    description: 'Acceso invitado para una clínica piloto o cliente estratégico.',
    state: 'trial',
    type: 'invite',
    expiresInDays: 30,
  },
  'UPWAY-VIP': {
    label: 'Acceso VIP',
    description: 'Código premium para clientes con acceso gestionado directamente por Upway.',
    state: 'active',
    type: 'gift',
    expiresInDays: 90,
  },
};

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

export function getConfiguredAccessCodes() {
  const envValue = process.env.BILLING_ACCESS_CODES ?? '';
  const extras = envValue
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, AccessCodeDefinition>>((acc, code) => {
      const [key, label, stateValue] = code.split(':');
      const normalizedKey = (key ?? '').trim().toUpperCase();
      if (!normalizedKey) return acc;

      acc[normalizedKey] = {
        label: (label ?? 'Código acceso').trim() || 'Código acceso',
        description: 'Acceso gestionado por el equipo comercial de Upway.',
        state: (stateValue ?? 'trial').trim().toLowerCase() === 'active' ? 'active' : 'trial',
        type: 'invite',
        expiresInDays: 30,
      };
      return acc;
    }, {});

  return { ...builtInAccessCodes, ...extras };
}

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

export async function resolveAccessFromPromoCode(rawCode?: string | null) {
  const normalized = String(rawCode ?? '').trim().toUpperCase();
  if (!normalized) {
    return { valid: false as const, message: 'No se ingresó un código de acceso.' };
  }

  const matches = getConfiguredAccessCodes()[normalized];
  if (matches) {
    return {
      valid: true as const,
      ...matches,
    };
  }

  const { prisma } = await import('@/lib/prisma');
  const record = await prisma.billingAccessCode.findFirst({
    where: {
      code: normalized,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { valid: false as const, message: 'Ese código no existe o ya no está activo.' };
  }

  const state = resolveBillingState(record.state);
  const type = String(record.type ?? 'trial').trim().toLowerCase();

  return {
    valid: true as const,
    label: record.label,
    description: record.description ?? 'Acceso autorizado por el equipo de Upway.',
    state,
    type: type === 'invite' || type === 'gift' ? type : 'trial',
    expiresInDays: record.expiresAt
      ? Math.max(0, Math.ceil((record.expiresAt.getTime() - Date.now()) / 86400000))
      : undefined,
  };
}

export function getEffectiveBillingState(input?: string | null, fallbackState = 'trial') {
  return resolveBillingState(input ?? fallbackState);
}

export function canAccessDashboard(input?: string | null) {
  return billingStateMeta[resolveBillingState(input)].canAccessDashboard;
}

export function getBillingStateMeta(input?: string | null) {
  return billingStateMeta[resolveBillingState(input)];
}

export function getBillingAccessDecision(input?: string | null) {
  const state = resolveBillingState(input);
  const meta = billingStateMeta[state];
  return {
    state,
    ...meta,
  };
}
