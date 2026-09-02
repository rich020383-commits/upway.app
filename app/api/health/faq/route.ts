import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'support-agent';

  try {
    enforceHealthAccess({ role, module: 'faq', organizationId: 'org-1', clinicId: 'clinic-1' });

    const payload = withTenantScope(
      {
        items: [
          {
            id: 'faq-1',
            question: '¿Cuánto tiempo tarda la atención?',
            answer: 'La primera respuesta se prioriza en minutos, y el flujo de atención se revisa según la prioridad de la solicitud.',
            category: 'general',
            isPublished: true,
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
