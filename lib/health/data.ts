import { prisma } from '@/lib/prisma';
import { createScopedQuery } from './tenant';
import type { HealthModule, TenantScope } from './types';

export function buildHealthQuery(scope: TenantScope, module: HealthModule) {
  const scopedQuery = createScopedQuery(scope, 'clinicId');

  return {
    ...scopedQuery,
    module,
    organizationId: scope.organizationId ?? '',
    clinicId: scope.clinicId ?? '',
  };
}

function getFallbackMetrics() {
  return {
    conversations: 0,
    resolved: 0,
    escalations: 0,
    noShows: 0,
    avgResponseSeconds: 0,
    activeAgents: 0,
  };
}

/**
 * DERIVED/DEMO METRICS — NOT real operational data.
 *
 * These values are synthesized from configuration state (number of triage rules,
 * FAQs, compliance policies, onboarding status) to seed the health dashboard UI
 * while real conversation/agent analytics are not yet available. They do NOT
 * count actual Message/Conversation records.
 *
 * To wire this to real data, replace the derived values below with Prisma
 * aggregate queries against the `Conversation` and `Message` models
 * (e.g. counts by status, response times from message timestamps).
 */
export async function summarizeDemoHealthMetrics(scope: TenantScope = {}) {
  // Sin tenant real no se consulta "la primera activa": se devuelve fallback vacío
  // para no filtrar datos de otro negocio (antes caía a {status:'active'}).
  if (!scope.clinicId && !scope.organizationId) {
    return { ...getFallbackMetrics(), isDemo: true as const };
  }
  const clinicWhere = scope.clinicId
    ? { id: scope.clinicId }
    : { organizationId: scope.organizationId };

  try {
    const clinic = await prisma.clinic.findFirst({
      where: clinicWhere,
      include: {
        healthProfile: {
          include: {
            triageRules: { where: { isActive: true } },
            faqs: { where: { isPublished: true } },
            compliancePolicies: { where: { isRequired: true } },
          },
        },
        onboardingSessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!clinic) {
      return { ...getFallbackMetrics(), isDemo: true as const };
    }

    const healthProfile = clinic.healthProfile;
    const activeTriageRules = healthProfile?.triageRules.length ?? 0;
    const publishedFaqs = healthProfile?.faqs.length ?? 0;
    const requiredPolicies = healthProfile?.compliancePolicies.length ?? 0;
    const onboardingStatus = clinic.onboardingSessions[0]?.status ?? 'DRAFT';

    return {
      conversations: 380 + activeTriageRules * 40 + publishedFaqs * 10,
      resolved: Math.min(98, 75 + activeTriageRules * 3 + requiredPolicies),
      escalations: Math.max(8, 12 + (onboardingStatus === 'ACTIVE' ? 4 : 8)),
      noShows: Math.max(5, 8 + (publishedFaqs > 0 ? 2 : 0)),
      avgResponseSeconds: 60 + activeTriageRules * 12 + requiredPolicies * 8,
      activeAgents: Math.max(2, 3 + Math.min(7, activeTriageRules / 2)),
      isDemo: true as const,
    };
  } catch (error) {
    console.warn('Health metrics fallback activated:', error);
    return { ...getFallbackMetrics(), isDemo: true as const };
  }
}
