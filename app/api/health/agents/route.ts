import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'triage-manager';

  try {
    enforceHealthAccess({ role, module: 'agents', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'agent-1',
            name: 'Sofía clínica',
            channel: 'WhatsApp',
            tone: 'professional',
            status: 'active',
          },
          {
            id: 'agent-2',
            name: 'Asistente de gestión',
            channel: 'Vapi',
            tone: 'warm',
            status: 'standby',
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
