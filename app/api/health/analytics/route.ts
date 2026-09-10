import { NextRequest, NextResponse } from 'next/server';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'analytics', organizationId, clinicId });

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
      { organizationId, clinicId, role }
    );

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Acceso denegado' },
      { status: 403 }
    );
  }
}
