import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'leadId es requerido' }, { status: 400 });
    }

    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    console.error('Error fetching lead activity:', error);
    return NextResponse.json({ error: 'No se pudo cargar el timeline del lead' }, { status: 500 });
  }
}
