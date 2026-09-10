import { NextRequest, NextResponse } from 'next/server';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'inbox', organizationId, clinicId });

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
            channel: 'Telnyx Voice',
            priority: 'medium',
            summary: 'Consulta sobre disponibilidad en medicina general.',
            status: 'pending',
          },
        ],
      },
      { organizationId, clinicId, role }
    );

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}
