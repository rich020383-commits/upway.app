import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'clinic-admin';

  try {
    enforceHealthAccess({ role, module: 'settings', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        clinic: {
          id: 'clinic-1',
          name: 'Clínica Santa María',
          specialty: 'Medicina general',
          timezone: 'America/Bogota',
          status: 'active',
        },
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
