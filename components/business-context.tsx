"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { canAccessHealthModule } from '@/lib/health/permissions';
import type { TenantScope } from '@/lib/health/types';

const HEALTH_CLINIC_NAME_KEY = 'upway-health-clinic-name';
const HEALTH_ORGANIZATION_NAME_KEY = 'upway-health-organization-name';

export type BusinessContextValue = {
  organizationId: string;
  clinicId: string;
  organizationName: string;
  clinicName: string;
  role: string;
  displayRole: string;
  normalizedScope: TenantScope;
  canAccessModule: (module: string) => boolean;
};

const defaultContext: BusinessContextValue = {
  organizationId: 'default-org',
  clinicId: 'default-clinic',
  organizationName: 'Upway Health',
  clinicName: 'Mi clínica',
  role: 'clinic-admin',
  displayRole: 'Clinic Admin',
  normalizedScope: {
    organizationId: 'default-org',
    clinicId: 'default-clinic',
    role: 'clinic-admin',
  },
  canAccessModule: (module: string) => canAccessHealthModule('clinic-admin', module as keyof typeof import('@/lib/health/permissions').healthPermissions),
};

const BusinessContext = createContext<BusinessContextValue>(defaultContext);

export function BusinessContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [storedClinicName, setStoredClinicName] = useState('');
  const [storedOrganizationName, setStoredOrganizationName] = useState('');

  useEffect(() => {
    try {
      const clinicName = localStorage.getItem(HEALTH_CLINIC_NAME_KEY);
      const organizationName = localStorage.getItem(HEALTH_ORGANIZATION_NAME_KEY);

      if (clinicName) {
        setStoredClinicName(clinicName);
      }

      if (organizationName) {
        setStoredOrganizationName(organizationName);
      }
    } catch {
      // localStorage may be unavailable on some environments.
    }
  }, []);

  const value = useMemo<BusinessContextValue>(() => {
    const user = (session?.user as Record<string, unknown> | undefined) ?? {};
    const role = String(user.role ?? 'clinic-admin');
    const organizationId = String(user.organizationId ?? 'default-org');
    const clinicId = String(user.clinicId ?? 'default-clinic');
    const organizationName = String(user.organizationName ?? (storedOrganizationName || 'Upway Health'));
    const clinicName = String(user.clinicName ?? (storedClinicName || 'Mi clínica'));
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
      displayRole: role
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      normalizedScope,
      canAccessModule: (module: string) => canAccessHealthModule(role, module as keyof typeof import('@/lib/health/permissions').healthPermissions),
    };
  }, [session, storedClinicName, storedOrganizationName]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  return useContext(BusinessContext);
}
