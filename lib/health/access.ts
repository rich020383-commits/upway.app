import { canAccessHealthModule } from './permissions';
import type { HealthModule, TenantScope } from './types';

export type HealthAccessContext = TenantScope & {
  module: HealthModule;
};

const sensitiveModules: HealthModule[] = ['compliance', 'settings', 'onboarding', 'policies', 'analytics'];

export function requireTenantScope(scope: TenantScope, module: HealthModule) {
  const requiresExplicitScope = sensitiveModules.includes(module);
  const hasOrganization = Boolean(
    scope.organizationId && scope.organizationId !== 'default-org' && scope.organizationId !== ''
  );
  const hasClinic = Boolean(
    scope.clinicId && scope.clinicId !== 'default-clinic' && scope.clinicId !== ''
  );

  if (requiresExplicitScope && (!hasOrganization || !hasClinic)) {
    throw new Error(
      `Tenant scope required for ${module}. Provide organizationId and clinicId before accessing protected Health data.`
    );
  }

  return {
    organizationId: scope.organizationId ?? '',
    clinicId: scope.clinicId ?? '',
    isDemoScope: !hasOrganization || !hasClinic,
  };
}

export function enforceHealthAccess({ role, module, organizationId, clinicId }: HealthAccessContext) {
  if (!role) {
    throw new Error('Access denied: missing role');
  }

  if (!canAccessHealthModule(role, module)) {
    throw new Error(`Access denied for role ${role} on module ${module}`);
  }

  requireTenantScope({ organizationId, clinicId }, module);

  return true;
}

export function getHealthAccessDecision({ role, module, organizationId, clinicId }: HealthAccessContext) {
  const scopeCheck = (() => {
    try {
      requireTenantScope({ organizationId, clinicId }, module);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  })();

  return {
    allowed: Boolean(role) && canAccessHealthModule(role ?? '', module) && scopeCheck.valid,
    role,
    module,
    scopeValid: scopeCheck.valid,
    requiresTenantScope: sensitiveModules.includes(module),
  };
}
