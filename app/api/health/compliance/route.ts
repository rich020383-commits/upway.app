import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';
import { getHealthSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'compliance', organizationId, clinicId });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);

    const [requiredPolicies, publishedFaqs, activeTriageRules, recentAuditEvents] = await Promise.all([
      prisma.healthCompliancePolicy.count({ where: { profileId: profile.id, isRequired: true } }),
      prisma.healthFAQ.count({ where: { profileId: profile.id, isPublished: true } }),
      prisma.healthTriageRule.count({ where: { profileId: profile.id, isActive: true } }),
      prisma.healthAuditLog.count({ where: { clinicId: clinic.id } }),
    ]);

    const items = [
      {
        id: 'compliance-policies',
        title: 'Políticas obligatorias',
        status: requiredPolicies > 0 ? 'Configuradas' : 'Sin definir',
        value: `${requiredPolicies} activas`,
      },
      {
        id: 'compliance-faqs',
        title: 'FAQs publicadas',
        status: publishedFaqs > 0 ? 'Con contenido' : 'Sin contenido',
        value: `${publishedFaqs} publicadas`,
      },
      {
        id: 'compliance-triage',
        title: 'Reglas de triaje activas',
        status: activeTriageRules > 0 ? 'Operativo' : 'Sin reglas',
        value: `${activeTriageRules} activas`,
      },
      {
        id: 'compliance-audit',
        title: 'Auditoría de acceso',
        status: recentAuditEvents > 0 ? 'Con historial' : 'Sin eventos registrados',
        value: `${recentAuditEvents} eventos`,
      },
    ];

    const payload = withTenantScope({ items }, { organizationId, clinicId: clinic.id, role });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}
