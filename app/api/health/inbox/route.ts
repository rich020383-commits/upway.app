import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'support-agent';

  try {
    enforceHealthAccess({ role, module: 'inbox', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'conversation-1',
            patient: 'Laura Mendoza',
            channel: 'WhatsApp',
            priority: 'high',
            summary: 'Solicita reprogramación y confirma horario.',
            status: 'active',
          },
          {
            id: 'conversation-2',
            patient: 'María Fernanda',
            channel: 'VAPI',
            priority: 'medium',
            summary: 'Consulta sobre disponibilidad en medicina general.',
            status: 'pending',
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
