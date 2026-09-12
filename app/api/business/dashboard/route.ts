import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTiendaId = searchParams.get('tiendaId');

    // 🛡️ Multi-tenant estricto: requiere sesión activa y valida ownership
    const { tienda, error } = await getOwnedTienda(request, prisma, requestedTiendaId);
    if (error) return error;

    const tiendaId = tienda.id;
    const segment = tienda.segment || 'general';
    const where = { tiendaId };

    const totalLeads = await prisma.lead.count({ where });
    const newLeads = await prisma.lead.count({ where: { ...where, estado: 'NEW' } });
    const appointments = await prisma.cita.count({ where: { ...where, fechaHora: { gte: new Date() } } });
    const pendingReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        lead: { tiendaId },
      },
    });
    const dueReminders = await prisma.leadReminder.count({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        lead: { tiendaId },
      },
    });
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const nextAppointments = await prisma.cita.findMany({
      where: { ...where, fechaHora: { gte: new Date() } },
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
      NEW: await prisma.lead.count({ where: { ...where, estado: 'NEW' } }),
      CONTACTED: await prisma.lead.count({ where: { ...where, estado: 'CONTACTED' } }),
      APPOINTMENT_BOOKED: await prisma.lead.count({ where: { ...where, estado: 'APPOINTMENT_BOOKED' } }),
      FOLLOW_UP: await prisma.lead.count({ where: { ...where, estado: 'FOLLOW_UP' } }),
      CLOSED_WON: await prisma.lead.count({ where: { ...where, estado: 'CLOSED_WON' } }),
      CLOSED_LOST: await prisma.lead.count({ where: { ...where, estado: 'CLOSED_LOST' } }),
    };

    const inbox = await prisma.conversation.findMany({
      where: { tiendaId },
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
      where: { assignedLeads: { some: { tiendaId } } },
      select: {
        id: true,
        name: true,
        email: true,
        assignedLeads: {
          where: { tiendaId },
          select: {
            estado: true,
            appointments: { select: { id: true, fechaHora: true }, take: 1, orderBy: { fechaHora: 'asc' } },
          },
        },
      },
      take: 20,
    });

    const agentPerformance = agentsRaw
      .map((agent) => {
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
      })
      .sort((a, b) => b.totalLeads - a.totalLeads);

    // ==========================================
    // 🎯 ACCIONES DE HOY (lista priorizada de la operación)
    // ==========================================
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const leadWhere = { tiendaId };

    const dueRemindersList = await prisma.leadReminder.findMany({
      where: { status: 'PENDING', scheduledFor: { lte: now }, lead: { tiendaId } },
      take: 10,
      include: { lead: { select: { id: true, nombre: true, phone: true } } },
      orderBy: { scheduledFor: 'asc' },
    });

    const unassignedNewLeads = await prisma.lead.findMany({
      where: { ...leadWhere, estado: 'NEW', assignedToUserId: null, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      take: 10,
      select: { id: true, nombre: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const coldLeads = await prisma.lead.findMany({
      where: {
        ...leadWhere,
        estado: { in: ['CONTACTED', 'FOLLOW_UP'] },
        lastContactAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
      take: 10,
      select: { id: true, nombre: true, phone: true, estado: true, lastContactAt: true },
      orderBy: { lastContactAt: 'asc' },
    });

    const tomorrowEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const upcomingAppointmentsAll = await prisma.cita.findMany({
      where: { tiendaId, fechaHora: { gte: now, lte: tomorrowEnd } },
      select: { id: true, clienteNombre: true, fechaHora: true, estado: true },
      orderBy: { fechaHora: 'asc' },
    });
    const unconfirmedAppointments = upcomingAppointmentsAll.filter((c) => c.estado !== 'CONFIRMED');

    const todayActions = {
      dueReminders: dueRemindersList.map((r) => ({ id: r.id, leadId: r.leadId, nombre: r.lead?.nombre ?? 'Cliente', phone: r.lead?.phone ?? null, scheduledFor: r.scheduledFor })),
      unassignedNewLeads,
      coldLeads,
      unconfirmedAppointments,
    };

    // ==========================================
    // 📈 TENDENCIA 7 DÍAS (comparativa vs semana anterior)
    // ==========================================
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const [leadsThisWeek, leadsLastWeek, citasThisWeek, citasLastWeek] = await Promise.all([
      prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: weekAgo } } }),
      prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      prisma.cita.count({ where: { tiendaId, createdAt: { gte: weekAgo } } }),
      prisma.cita.count({ where: { tiendaId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    ]);
    const pct = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
    const trend = {
      leads: { current: leadsThisWeek, previous: leadsLastWeek, pct: pct(leadsThisWeek, leadsLastWeek) },
      citas: { current: citasThisWeek, previous: citasLastWeek, pct: pct(citasThisWeek, citasLastWeek) },
    };

    // ==========================================
    // 💰 CONSUMO DEL MES
    // ==========================================
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const voiceWhere = { tiendaId, createdAt: { gte: monthStart } };
    const [voiceAgg, messagesThisMonth] = await Promise.all([
      prisma.llamadaLog.aggregate({
        where: voiceWhere,
        _count: { _all: true },
        _sum: { durationMinutes: true, telnyxCost: true, vapiCost: true, upwayBilledCost: true },
      }),
      prisma.message.count({ where: { conversation: { tiendaId }, createdAt: { gte: monthStart } } }),
    ]);
    const telnyxCostRaw = (voiceAgg._sum.telnyxCost ?? 0) + (voiceAgg._sum.vapiCost ?? 0);
    const consumption = {
      month: monthStart.toISOString(),
      messages: messagesThisMonth,
      voiceCalls: voiceAgg._count._all,
      voiceMinutes: Math.round((voiceAgg._sum.durationMinutes ?? 0) * 10) / 10,
      telnyxCost: Math.round(telnyxCostRaw * 100) / 100,
      // Alias legacy para UI antigua: vapiCost refleja telnyx hasta retirar Vapi.
      vapiCost: Math.round(telnyxCostRaw * 100) / 100,
      billedCost: Math.round((voiceAgg._sum.upwayBilledCost ?? 0) * 100) / 100,
    };

    return NextResponse.json({
      ok: true,
      segment,
      summary: {
        totalLeads,
        newLeads,
        appointments,
        todayAppointments: await prisma.cita.count({
          where: {
            tiendaId,
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
      todayActions,
      trend,
      consumption,
    });
  } catch (error) {
    console.error('Error fetching business dashboard:', error);
    return NextResponse.json({ error: 'No se pudo generar el panel operativo' }, { status: 500 });
  }
}
