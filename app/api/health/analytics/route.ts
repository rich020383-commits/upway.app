import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'analyst';

  try {
    enforceHealthAccess({ role, module: 'analytics', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        summary: {
          conversations: 1248,
          resolved: 87,
          escalations: 32,
          noShows: 13,
          avgResponseSeconds: 134,
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
