import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'compliance-reviewer';
  const clinicId = searchParams.get('clinicId') ?? undefined;
  const organizationId = searchParams.get('organizationId') ?? undefined;

  try {
    enforceHealthAccess({ role, module: 'compliance', organizationId: organizationId ?? 'org-1', clinicId: clinicId ?? 'clinic-1' });

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

    const payload = withTenantScope({ items }, { organizationId: organizationId ?? 'org-1', clinicId: clinic.id, role });
    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}
