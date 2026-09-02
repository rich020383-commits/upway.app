import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'triage-manager';

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'triage-1',
            name: 'Urgencia prioritaria',
            severity: 'critical',
            condition: 'Dolor intenso o síntomas de urgencia.',
            action: 'Escalar a humano y priorizar respuesta inmediata.',
            isActive: true,
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
