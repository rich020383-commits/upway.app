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
  organizationId: '',
  clinicId: '',
  organizationName: '',
  clinicName: '',
  role: '',
  displayRole: '',
  vertical: 'general',
  normalizedScope: {
    organizationId: '',
    clinicId: '',
    role: '',
  },
  canAccessModule: () => false,
};

const BusinessContext = createContext<BusinessContextValue>(defaultContext);

function normalizeDisplayRole(role: string) {
  const normalized = role
    .replace(/[-_]/g, ' ')
    .trim()
    .toLowerCase();

  if (!normalized) return '';
  if (normalized === 'clinic admin') return 'Administrador';
  if (normalized === 'org owner') return 'Propietario';
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

      // Diferimos el setState para evitar un render en cascada dentro del efecto.
      const commit = () => {
        if (clinicName) setStoredClinicName(clinicName);
        if (organizationName) setStoredOrganizationName(organizationName);
      };
      const id = requestAnimationFrame(commit);
      return () => cancelAnimationFrame(id);
    } catch {
      // localStorage may be unavailable on some environments.
    }
  }, []);

  const value = useMemo<BusinessContextValue>(() => {
    const user = (session?.user as Record<string, unknown> | undefined) ?? {};
    const vertical = String(user.vertical ?? user.businessType ?? 'general').toLowerCase();
    const resolvedVertical = resolveVertical(vertical);
    const role = String(user.role ?? '');
    const organizationId = String(user.organizationId ?? '');
    const clinicId = String(user.clinicId ?? '');
    // Sin sesión no hay fallback inventado: se deja vacío para que el layout
    // redirija a /login en vez de mostrar "Negocio general" fantasma.
    const organizationFallback = storedOrganizationName || resolvedVertical.label || '';
    const clinicFallback = storedClinicName || '';
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
        if (!role || !module) return false;
        try {
          return canAccessHealthModule(
            role,
            module as keyof typeof import('@/lib/health/permissions').healthPermissions
          );
        } catch {
          return false;
        }
      },
    };
  }, [session, storedClinicName, storedOrganizationName]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  return useContext(BusinessContext);
}
