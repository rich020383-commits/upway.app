import { enforceHealthAccess } from '@/lib/health/access';
import { summarizeDemoHealthMetrics } from '@/lib/health/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'clinic-admin';
  const moduleName = 'overview' as const;
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const clinicId = searchParams.get('clinicId') ?? undefined;

  try {
    enforceHealthAccess({ role, module: moduleName });

    const metrics = await summarizeDemoHealthMetrics({ organizationId: organizationId ?? undefined, clinicId: clinicId ?? undefined, role });

    return Response.json({
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
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}
