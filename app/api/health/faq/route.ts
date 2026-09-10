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
    enforceHealthAccess({ role, module: 'faq', organizationId, clinicId });

    const clinic = await ensureClinicForId(clinicId, organizationId);
    if (!clinic) throw new Error('No se pudo resolver la clínica.');

    const profile = await ensureHealthProfile(clinic.id);
    const faqs = await prisma.healthFAQ.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = withTenantScope({ items: faqs }, { organizationId, clinicId: clinic.id, role });
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
    enforceHealthAccess({ role, module: 'faq', organizationId, clinicId });

    const body = await request.json();
    const { question, answer, category, isPublished } = body;
    if (!question || !answer) {
      return NextResponse.json({ error: 'La pregunta y la respuesta son obligatorias.' }, { status: 400 });
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

    return NextResponse.json({ success: true, item: faq });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo crear la FAQ.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'faq', organizationId, clinicId });

    const body = await request.json();
    const { id, question, answer, category, isPublished } = body;
    if (!id) return NextResponse.json({ error: 'Falta el id de la FAQ.' }, { status: 400 });

    // 🛡️ Validar pertenencia a la clínica autenticada
    const existingFaq = await prisma.healthFAQ.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingFaq || (clinicId !== 'default-clinic' && existingFaq.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'FAQ no encontrada o sin autorización.' }, { status: 404 });
    }

    const faq = await prisma.healthFAQ.update({
      where: { id },
      data: {
        ...(question !== undefined ? { question } : {}),
        ...(answer !== undefined ? { answer } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    });

    return NextResponse.json({ success: true, item: faq });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo actualizar la FAQ.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'faq', organizationId, clinicId });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta el id de la FAQ.' }, { status: 400 });

    // 🛡️ Validar pertenencia a la clínica autenticada
    const existingFaq = await prisma.healthFAQ.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingFaq || (clinicId !== 'default-clinic' && existingFaq.profile.clinicId !== clinicId)) {
      return NextResponse.json({ error: 'FAQ no encontrada o sin autorización.' }, { status: 404 });
    }

    await prisma.healthFAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo eliminar la FAQ.' },
      { status: 400 }
    );
  }
}
