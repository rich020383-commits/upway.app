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
    enforceHealthAccess({ role, module: 'policies', organizationId, clinicId });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const policies = await prisma.healthCompliancePolicy.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: policies }, { organizationId, clinicId: clinic.id, role });
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
    enforceHealthAccess({ role, module: 'policies', organizationId, clinicId });

    const body = await request.json();
    const { title, body: policyBody, version, isRequired } = body;
    if (!title || !policyBody) {
      return NextResponse.json({ error: 'El título y el contenido de la política son obligatorios.' }, { status: 400 });
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

    return NextResponse.json({ success: true, item: policy });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo crear la política.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'policies', organizationId, clinicId });

    const body = await request.json();
    const { id, title, body: policyBody, version, isRequired } = body;
    if (!id) return NextResponse.json({ error: 'Falta el id de la política.' }, { status: 400 });

    // 🛡️ Validar pertenencia a la clínica autenticada
    const existingPolicy = await prisma.healthCompliancePolicy.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingPolicy || (clinicId !== 'default-clinic' && existingPolicy.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'Política no encontrada o sin autorización.' }, { status: 404 });
    }

    const policy = await prisma.healthCompliancePolicy.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(policyBody !== undefined ? { body: policyBody } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(isRequired !== undefined ? { isRequired } : {}),
      },
    });

    return NextResponse.json({ success: true, item: policy });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo actualizar la política.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'policies', organizationId, clinicId });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta el id de la política.' }, { status: 400 });

    // 🛡️ Validar pertenencia a la clínica autenticada
    const existingPolicy = await prisma.healthCompliancePolicy.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingPolicy || (clinicId !== 'default-clinic' && existingPolicy.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'Política no encontrada o sin autorización.' }, { status: 404 });
    }

    await prisma.healthCompliancePolicy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo eliminar la política.' },
      { status: 400 }
    );
  }
}
