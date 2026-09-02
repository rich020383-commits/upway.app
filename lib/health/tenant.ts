import { TenantScope } from './types';

export function normalizeTenantScope(scope: TenantScope) {
  return {
    organizationId: scope.organizationId ?? 'default-org',
    clinicId: scope.clinicId ?? 'default-clinic',
    role: scope.role ?? 'clinic-admin',
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
  const hasOrganization = Boolean(scope.organizationId && scope.organizationId !== 'default-org');
  const hasClinic = Boolean(scope.clinicId && scope.clinicId !== 'default-clinic');

  return {
    where: {
      ...(hasOrganization ? { organizationId: scope.organizationId } : {}),
      ...(hasClinic ? { [fieldName]: scope.clinicId } : { [fieldName]: scope.clinicId ?? 'default-clinic' }),
    },
  };
}

export function isTenantScoped(scope: TenantScope) {
  return Boolean(scope.organizationId && scope.clinicId && scope.organizationId !== 'default-org' && scope.clinicId !== 'default-clinic');
}
