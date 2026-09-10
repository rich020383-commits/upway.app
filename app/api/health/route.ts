import { NextRequest, NextResponse } from 'next/server';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { summarizeDemoHealthMetrics } from '@/lib/health/data';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;
  const moduleName = 'overview' as const;

  try {
    enforceHealthAccess({ role, module: moduleName, organizationId, clinicId });

    const metrics = await summarizeDemoHealthMetrics({
      organizationId,
      clinicId,
      role,
    });

    return NextResponse.json({
      vertical: 'health',
      status: 'ready',
      modules: [
        'overview',
        'inbox',
        'agents',
        'triage',
        'policies',
        'faq',
        'analytics',
        'compliance',
        'onboarding',
      ],
      metrics,
      privacy: {
        tenantIsolation: true,
        roleBasedAccess: true,
        encryptionAtRest: true,
        auditTrail: true,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Acceso denegado' },
      { status: 403 }
    );
  }
}
