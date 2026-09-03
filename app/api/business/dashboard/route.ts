import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    const where = tiendaId ? { tiendaId } : undefined;
    const totalLeads = await prisma.lead.count({ where });
    const newLeads = await prisma.lead.count({ where: { estado: 'NEW', ...(tiendaId ? { tiendaId } : {}) } });
    const appointments = await prisma.cita.count({ where: { ...(tiendaId ? { tiendaId } : {}), fechaHora: { gte: new Date() } } });
    const pendingReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        ...(tiendaId ? { lead: { tiendaId } } : {}),
      },
    });
    const dueReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        ...(tiendaId ? { lead: { tiendaId } } : {}),
      },
    });
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const nextAppointments = await prisma.cita.findMany({
      where: { ...(tiendaId ? { tiendaId } : {}), fechaHora: { gte: new Date() } },
      orderBy: { fechaHora: 'asc' },
      take: 5,
    });

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        conversations: true,
        appointments: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const pipeline = {
      NEW: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'NEW' } }),
      CONTACTED: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'CONTACTED' } }),
      APPOINTMENT_BOOKED: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'APPOINTMENT_BOOKED' } }),
      FOLLOW_UP: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'FOLLOW_UP' } }),
      CLOSED_WON: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'CLOSED_WON' } }),
      CLOSED_LOST: await prisma.lead.count({ where: { ...(tiendaId ? { tiendaId } : {}), estado: 'CLOSED_LOST' } }),
    };

    const inbox = await prisma.conversation.findMany({
      where: tiendaId ? { tiendaId } : undefined,
      include: {
        lead: { select: { id: true, nombre: true, estado: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 4,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });

    const agentsRaw = await prisma.user.findMany({
      where: tiendaId
        ? { assignedLeads: { some: { tiendaId } } }
        : { assignedLeads: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        assignedLeads: {
          where: tiendaId ? { tiendaId } : undefined,
          select: {
            estado: true,
            appointments: { select: { id: true, fechaHora: true }, take: 1, orderBy: { fechaHora: 'asc' } },
          },
        },
      },
      take: 20,
    });

    const agentPerformance = agentsRaw.map((agent) => {
      const assigned = agent.assignedLeads;
      const active = assigned.filter((lead) => !['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'].includes(lead.estado)).length;
      const closedWon = assigned.filter((lead) => lead.estado === 'CLOSED_WON').length;
      const withAppointment = assigned.filter((lead) => lead.appointments.length > 0).length;

      return {
        id: agent.id,
        name: agent.name || agent.email || 'Agente',
        totalLeads: assigned.length,
        active,
        closedWon,
        withAppointment,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    return NextResponse.json({
      ok: true,
      summary: {
        totalLeads,
        newLeads,
        appointments,
        todayAppointments: await prisma.cita.count({
          where: {
            ...(tiendaId ? { tiendaId } : {}),
            fechaHora: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),
        pendingReminders,
        dueReminders,
      },
      nextAppointments,
      leads,
      pipeline,
      inbox,
      agentPerformance,
    });
  } catch (error) {
    console.error('Error fetching business dashboard:', error);
    return NextResponse.json({ error: 'No se pudo generar el panel operativo' }, { status: 500 });
  }
}
