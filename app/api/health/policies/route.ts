import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'compliance-reviewer';

  try {
    enforceHealthAccess({ role, module: 'policies', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'policy-1',
            title: 'Cancelación y reprogramación',
            body: 'Las cancelaciones deben confirmarse con 12h de anticipación. Si el paciente usa la vía de urgencia, requiere revisión manual.',
            version: 'v1',
            isRequired: true,
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
