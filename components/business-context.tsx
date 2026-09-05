"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { canAccessHealthModule } from '@/lib/health/permissions';
import type { TenantScope } from '@/lib/health/types';
import { resolveVertical } from '@/lib/verticals';

const BUSINESS_CLINIC_NAME_KEY = 'upway-business-clinic-name';
const BUSINESS_ORGANIZATION_NAME_KEY = 'upway-business-organization-name';
const LEGACY_CLINIC_NAME_KEY = 'upway-health-clinic-name';
const LEGACY_ORGANIZATION_NAME_KEY = 'upway-health-organization-name';

export type BusinessContextValue = {
  organizationId: string;
  clinicId: string;
  organizationName: string;
  clinicName: string;
  role: string;
  displayRole: string;
  vertical: string;
  normalizedScope: TenantScope;
  canAccessModule: (module: string) => boolean;
};

const defaultContext: BusinessContextValue = {
  organizationId: 'default-org',
  clinicId: 'default-clinic',
  organizationName: 'Negocio general',
  clinicName: 'Espacio operativo',
  role: 'owner',
  displayRole: 'Propietario',
  vertical: 'general',
  normalizedScope: {
    organizationId: 'default-org',
    clinicId: 'default-clinic',
    role: 'owner',
  },
  canAccessModule: () => true,
};

const BusinessContext = createContext<BusinessContextValue>(defaultContext);

function normalizeDisplayRole(role: string) {
  const normalized = role
    .replace(/[-_]/g, ' ')
    .trim();

  if (!normalized) return 'Propietario';
  if (normalized === 'clinic admin' || normalized === 'clinic-admin' || normalized === 'clinic_admin') return 'Administrador';
  if (normalized === 'org owner' || normalized === 'org-owner' || normalized === 'org_owner') return 'Propietario';
  if (normalized === 'admin') return 'Administrador';
  if (normalized === 'owner') return 'Propietario';

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function BusinessContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [storedClinicName, setStoredClinicName] = useState('');
  const [storedOrganizationName, setStoredOrganizationName] = useState('');

  useEffect(() => {
    try {
      const clinicCandidates = [
        localStorage.getItem(BUSINESS_CLINIC_NAME_KEY),
        localStorage.getItem(LEGACY_CLINIC_NAME_KEY),
      ];
      const organizationCandidates = [
        localStorage.getItem(BUSINESS_ORGANIZATION_NAME_KEY),
        localStorage.getItem(LEGACY_ORGANIZATION_NAME_KEY),
      ];

      const clinicName = clinicCandidates.find(Boolean) ?? '';
      const organizationName = organizationCandidates.find(Boolean) ?? '';

      if (clinicName) setStoredClinicName(clinicName);
      if (organizationName) setStoredOrganizationName(organizationName);
    } catch {
      // localStorage may be unavailable on some environments.
    }
  }, []);

  const value = useMemo<BusinessContextValue>(() => {
    const user = (session?.user as Record<string, unknown> | undefined) ?? {};
    const vertical = String(user.vertical ?? user.businessType ?? 'general').toLowerCase();
    const resolvedVertical = resolveVertical(vertical);
    const role = String(user.role ?? 'owner');
    const organizationId = String(user.organizationId ?? 'default-org');
    const clinicId = String(user.clinicId ?? 'default-clinic');
    const organizationFallback = storedOrganizationName || resolvedVertical.label || 'Negocio general';
    const clinicFallback = storedClinicName || 'Espacio operativo';
    const organizationName = String(
      user.organizationName ?? user.businessName ?? organizationFallback
    );
    const clinicName = String(
      user.clinicName ?? user.businessName ?? clinicFallback
    );
    const normalizedScope: TenantScope = {
      organizationId,
      clinicId,
      role,
    };

    return {
      organizationId,
      clinicId,
      organizationName,
      clinicName,
      role,
      displayRole: normalizeDisplayRole(role),
      vertical: resolvedVertical.id,
      normalizedScope,
      canAccessModule: (module: string) => {
        if (!role || !module) return true;
        try {
          return canAccessHealthModule(
            role,
            module as keyof typeof import('@/lib/health/permissions').healthPermissions
          );
        } catch {
          return true;
        }
      },
    };
  }, [session, storedClinicName, storedOrganizationName]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  return useContext(BusinessContext);
}
