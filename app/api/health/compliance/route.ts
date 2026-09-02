import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'compliance-reviewer';

  try {
    enforceHealthAccess({ role, module: 'compliance', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'compliance-1',
            title: 'Registro de acceso y cambios críticos',
            summary: 'Todo cambio de triage, tono o política requiere audit trail y aprobación del responsable.',
            version: 'v1',
            approvedBy: 'clinic-admin',
          },
        ],
      },
      { organizationId: 'org-1', clinicId: 'clinic-1', role }
    );

    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}
