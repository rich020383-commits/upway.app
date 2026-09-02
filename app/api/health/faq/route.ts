import { prisma } from '@/lib/prisma';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { ensureClinicForId, ensureHealthProfile } from '@/lib/health/clinic-context';

const DEFAULT_CLINIC_ID = 'demo-clinic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'support-agent';
  const clinicId = searchParams.get('clinicId') ?? undefined;
  const organizationId = searchParams.get('organizationId') ?? undefined;

  try {
    enforceHealthAccess({ role, module: 'faq', organizationId: organizationId ?? 'org-1', clinicId: clinicId ?? 'clinic-1' });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const faqs = await prisma.healthFAQ.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: faqs }, { organizationId: organizationId ?? 'org-1', clinicId: clinic.id, role });
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
    const role = body.role ?? 'support-agent';
    const clinicId = body.clinicId ?? DEFAULT_CLINIC_ID;
    const organizationId = body.organizationId ?? undefined;

    enforceHealthAccess({ role, module: 'faq', organizationId: organizationId ?? 'org-1', clinicId });

    const { question, answer, category, isPublished } = body;
    if (!question || !answer) {
      return Response.json({ error: 'La pregunta y la respuesta son obligatorias.' }, { status: 400 });
    }

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');
    const profile = await ensureHealthProfile(clinic.id);

    const faq = await prisma.healthFAQ.create({
      data: {
        profileId: profile.id,
        question,
        answer,
        category: category ?? 'general',
        isPublished: isPublished ?? true,
      },
    });

    return Response.json({ success: true, item: faq });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear la FAQ.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, question, answer, category, isPublished } = body;
    if (!id) return Response.json({ error: 'Falta el id de la FAQ.' }, { status: 400 });

    const faq = await prisma.healthFAQ.update({
      where: { id },
      data: {
        ...(question !== undefined ? { question } : {}),
        ...(answer !== undefined ? { answer } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    });

    return Response.json({ success: true, item: faq });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar la FAQ.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Falta el id de la FAQ.' }, { status: 400 });

    await prisma.healthFAQ.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la FAQ.' },
      { status: 400 }
    );
  }
}
