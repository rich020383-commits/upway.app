import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';
import { getHealthSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId, clinicId });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const rules = await prisma.healthTriageRule.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: rules }, { organizationId, clinicId: clinic.id, role });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId, clinicId });

    const body = await request.json();
    const { name, condition, severity, action, isActive } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre de la regla es obligatorio.' }, { status: 400 });
    }
    if (!condition || !action) {
      return NextResponse.json({ error: 'La condición y la acción son obligatorias.' }, { status: 400 });
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

    return NextResponse.json({ success: true, item: rule });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo crear la regla.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId, clinicId });

    const body = await request.json();
    const { id, name, condition, severity, action, isActive } = body;
    if (!id) return NextResponse.json({ error: 'Falta el id de la regla.' }, { status: 400 });

    // 🛡️ Validar que la regla pertenezca a la clínica del usuario autenticado
    const existingRule = await prisma.healthTriageRule.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingRule || (clinicId !== 'default-clinic' && existingRule.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'Regla no encontrada o sin autorización.' }, { status: 404 });
    }

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

    return NextResponse.json({ success: true, item: rule });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo actualizar la regla.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'triage', organizationId, clinicId });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta el id de la regla.' }, { status: 400 });

    // 🛡️ Validar que la regla pertenezca a la clínica del usuario autenticado
    const existingRule = await prisma.healthTriageRule.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingRule || (clinicId !== 'default-clinic' && existingRule.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'Regla no encontrada o sin autorización.' }, { status: 404 });
    }

    await prisma.healthTriageRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo eliminar la regla.' },
      { status: 400 }
    );
  }
}
