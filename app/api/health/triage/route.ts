import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';

const DEFAULT_CLINIC_ID = 'demo-clinic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'triage-manager';
  const clinicId = searchParams.get('clinicId') ?? undefined;
  const organizationId = searchParams.get('organizationId') ?? undefined;

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId: organizationId ?? 'org-1', clinicId: clinicId ?? 'clinic-1' });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const rules = await prisma.healthTriageRule.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: rules }, { organizationId: organizationId ?? 'org-1', clinicId: clinic.id, role });
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
    const role = body.role ?? 'triage-manager';
    const clinicId = body.clinicId ?? DEFAULT_CLINIC_ID;
    const organizationId = body.organizationId ?? undefined;

    enforceHealthAccess({ role, module: 'triage', organizationId: organizationId ?? 'org-1', clinicId });

    const { name, condition, severity, action, isActive } = body;
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'El nombre de la regla es obligatorio.' }, { status: 400 });
    }
    if (!condition || !action) {
      return Response.json({ error: 'La condición y la acción son obligatorias.' }, { status: 400 });
    }

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');
    const profile = await ensureHealthProfile(clinic.id);

    const rule = await prisma.healthTriageRule.create({
      data: {
        profileId: profile.id,
        name,
        condition,
        severity: severity ?? 'medium',
        action,
        isActive: isActive ?? true,
      },
    });

    return Response.json({ success: true, item: rule });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear la regla.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, condition, severity, action, isActive } = body;
    if (!id) return Response.json({ error: 'Falta el id de la regla.' }, { status: 400 });

    const rule = await prisma.healthTriageRule.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(condition !== undefined ? { condition } : {}),
        ...(severity !== undefined ? { severity } : {}),
        ...(action !== undefined ? { action } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return Response.json({ success: true, item: rule });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar la regla.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Falta el id de la regla.' }, { status: 400 });

    await prisma.healthTriageRule.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la regla.' },
      { status: 400 }
    );
  }
}
