import { NextRequest, NextResponse } from 'next/server';
import { ActivityType, LeadStatus, ReminderStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assignLeadToUser, createLeadFromInbound, normalizeLeadStatus, toJson } from '@/lib/business-ops';
import { getOwnedTienda } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    // 🔐 Tenant-scoping: la sesión debe ser válida y la tienda (si se pide una
    // concreta) debe pertenecerle. Sin tiendaId se resuelve SU primera tienda,
    // nunca todas. 404 (no 403) para no filtrar la existencia de tiendas ajenas.
    const { tienda, error } = await getOwnedTienda(request, prisma, tiendaId);
    if (error) return error;

    const leads = await prisma.lead.findMany({
      where: { tiendaId: tienda.id },
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

// 🧩 Validación estricta del body de creación de leads. Los campos opcionales
// aceptan string o null; se rechazan tipos incorrectos antes de llegar a la DB.
const createLeadSchema = z.object({
  tiendaId: z.string().min(1, 'tiendaId es requerido'),
  nombre: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('email inválido').max(200).optional().nullable(),
  motivo: z.string().max(2000).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().nullable(),
  assignedToUserId: z.string().max(100).optional().nullable(),
  createdByUserId: z.string().max(100).optional().nullable(),
  messageContent: z.string().max(4000).optional().nullable(),
  clientName: z.string().max(200).optional().nullable(),
  metaCategory: z.string().max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 🧩 Validación del body: 400 con detalle de campos antes de tocar la DB.
    const parsed = createLeadSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Body inválido',
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 🔐 Solo se puede crear leads en tiendas propias.
    const { error } = await getOwnedTienda(request, prisma, data.tiendaId);
    if (error) return error;

    const result = await createLeadFromInbound({
      tiendaId: data.tiendaId,
      nombre: data.nombre,
      phone: data.phone,
      email: data.email,
      motivo: data.motivo,
      source: data.source,
      priority: data.priority,
      assignedToUserId: data.assignedToUserId,
      createdByUserId: data.createdByUserId,
      messageContent: data.messageContent,
      clientName: data.clientName,
      metaCategory: data.metaCategory,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, userId, assignedByUserId, reason, status } = body ?? {};

    if (!leadId) {
      return NextResponse.json({ error: 'leadId es requerido' }, { status: 400 });
    }

    // 🔐 El lead a mutar debe pertenecer a una tienda del usuario autenticado.
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId }, select: { tiendaId: true } });
    const { error } = await getOwnedTienda(request, prisma, existingLead?.tiendaId ?? null);
    if (error) return error;

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
