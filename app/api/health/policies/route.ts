import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';

const DEFAULT_CLINIC_ID = 'demo-clinic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'compliance-reviewer';
  const clinicId = searchParams.get('clinicId') ?? undefined;
  const organizationId = searchParams.get('organizationId') ?? undefined;

  try {
    enforceHealthAccess({ role, module: 'policies', organizationId: organizationId ?? 'org-1', clinicId: clinicId ?? 'clinic-1' });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const policies = await prisma.healthCompliancePolicy.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: policies }, { organizationId: organizationId ?? 'org-1', clinicId: clinic.id, role });
    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role ?? 'compliance-reviewer';
    const clinicId = body.clinicId ?? DEFAULT_CLINIC_ID;
    const organizationId = body.organizationId ?? undefined;

    enforceHealthAccess({ role, module: 'policies', organizationId: organizationId ?? 'org-1', clinicId });

    const { title, body: policyBody, version, isRequired } = body;
    if (!title || !policyBody) {
      return Response.json({ error: 'El título y el contenido de la política son obligatorios.' }, { status: 400 });
    }

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');
    const profile = await ensureHealthProfile(clinic.id);

    const policy = await prisma.healthCompliancePolicy.create({
      data: {
        profileId: profile.id,
        title,
        body: policyBody,
        version: version ?? 'v1',
        isRequired: isRequired ?? true,
      },
    });

    return Response.json({ success: true, item: policy });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear la política.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, body: policyBody, version, isRequired } = body;
    if (!id) return Response.json({ error: 'Falta el id de la política.' }, { status: 400 });

    const policy = await prisma.healthCompliancePolicy.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(policyBody !== undefined ? { body: policyBody } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(isRequired !== undefined ? { isRequired } : {}),
      },
    });

    return Response.json({ success: true, item: policy });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar la política.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Falta el id de la política.' }, { status: 400 });

    await prisma.healthCompliancePolicy.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la política.' },
      { status: 400 }
    );
  }
}
