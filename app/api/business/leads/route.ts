import { NextResponse } from 'next/server';
import { ActivityType, LeadStatus, ReminderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { assignLeadToUser, createLeadFromInbound, normalizeLeadStatus, toJson } from '@/lib/business-ops';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    const leads = await prisma.lead.findMany({
      where: tiendaId ? { tiendaId } : undefined,
      include: {
        conversations: true,
        appointments: {
          orderBy: { fechaHora: 'asc' },
          take: 3,
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 3,
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tiendaId, nombre, phone, email, motivo, source, priority, assignedToUserId, createdByUserId, messageContent, clientName, metaCategory } = body ?? {};

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId is required' }, { status: 400 });
    }

    const result = await createLeadFromInbound({
      tiendaId,
      nombre,
      phone,
      email,
      motivo,
      source,
      priority,
      assignedToUserId,
      createdByUserId,
      messageContent,
      clientName,
      metaCategory,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      lead: result.lead,
      conversation: result.conversation,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el lead' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { leadId, userId, assignedByUserId, reason, status } = body ?? {};

    if (!leadId) {
      return NextResponse.json({ error: 'leadId es requerido' }, { status: 400 });
    }

    // Cambio de etapa sin reasignación de agente (ej. "Mover a Cita").
    if (status && !userId) {
      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: { estado: normalizeLeadStatus(status) },
      });
      await prisma.leadActivity.create({
        data: {
          leadId,
          actorUserId: assignedByUserId ?? null,
          type: ActivityType.STATUS_CHANGED,
          summary: reason ?? `Lead movido a ${lead.estado}`,
          metadataJson: toJson({ status: lead.estado }),
        },
      });
      return NextResponse.json({ ok: true, lead });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido para asignar el lead' }, { status: 400 });
    }

    const result = await assignLeadToUser({
      leadId,
      userId,
      assignedByUserId,
      reason,
      status,
    });

    return NextResponse.json({ ok: true, lead: result.lead, assignment: result.assignment });
  } catch (error) {
    console.error('Error assigning lead:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo asignar el lead' }, { status: 500 });
  }
}
