import type { TenantScope } from './types';

const EMPTY_ORG = '';
const EMPTY_CLINIC = '';

export function normalizeTenantScope(scope: TenantScope) {
  return {
    organizationId: scope.organizationId ?? EMPTY_ORG,
    clinicId: scope.clinicId ?? EMPTY_CLINIC,
    role: scope.role ?? '',
  };
}

export function withTenantScope<T extends Record<string, unknown>>(payload: T, scope: TenantScope) {
  const normalized = normalizeTenantScope(scope);

  return {
    ...payload,
    tenantScope: normalized,
  };
}

export function createScopedQuery(scope: TenantScope, fieldName = 'clinicId') {
  // H5/C6: si no hay tenant real se lanza en vez de filtrar por valor fantasma.
  // Antes ponía where:{clinicId:'default-clinic'} que devolvía vacío silencioso.
  if (!isTenantScoped(scope)) {
    throw new Error(
      'Tenant scope requerido: inicia sesión con una organización y clínica reales antes de consultar datos.'
    );
  }

  return {
    where: {
      organizationId: scope.organizationId,
      [fieldName]: scope.clinicId,
    },
  };
}

export function isTenantScoped(scope: TenantScope) {
  return Boolean(
    scope.organizationId &&
    scope.clinicId &&
    scope.organizationId !== 'default-org' &&
    scope.clinicId !== 'default-clinic' &&
    scope.organizationId !== '' &&
    scope.clinicId !== ''
  );
}
