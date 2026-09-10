import { NextRequest, NextResponse } from 'next/server';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'settings', organizationId, clinicId });

    const payload = withTenantScope(
      {
        clinic: {
          id: clinicId,
          name: 'Espacio operativo',
          specialty: 'Medicina general',
          timezone: 'America/Bogota',
          status: 'active',
        },
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
