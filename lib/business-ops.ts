import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  ActivityType,
  AppointmentStatus,
  ConversationStatus,
  LeadPriority,
  LeadSource,
  LeadStatus,
  MessageDirection,
  MessageStatus,
  ReminderStatus,
} from '@prisma/client';

export type LeadSourceInput = keyof typeof LeadSource | string | null | undefined;

export function normalizePhone(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

export function normalizeLeadSource(source?: LeadSourceInput): LeadSource {
  const normalized = (source ?? 'WHATSAPP').toString().trim().toUpperCase();

  switch (normalized) {
    case 'VOICE':
      return LeadSource.VOICE;
    case 'WEB_FORM':
      return LeadSource.WEB_FORM;
    case 'LANDING_PAGE':
      return LeadSource.LANDING_PAGE;
    case 'REFERRAL':
      return LeadSource.REFERRAL;
    case 'MANUAL':
      return LeadSource.MANUAL;
    case 'OTHER':
      return LeadSource.OTHER;
    case 'WHATSAPP':
    default:
      return LeadSource.WHATSAPP;
  }
}

export function normalizeLeadPriority(priority?: string | null): LeadPriority {
  const normalized = (priority ?? 'MEDIUM').toString().trim().toUpperCase();

  switch (normalized) {
    case 'LOW':
      return LeadPriority.LOW;
    case 'HIGH':
      return LeadPriority.HIGH;
    case 'URGENT':
      return LeadPriority.URGENT;
    case 'MEDIUM':
    default:
      return LeadPriority.MEDIUM;
  }
}

export function normalizeLeadStatus(status?: string | null): LeadStatus {
  const normalized = (status ?? 'NEW').toString().trim().toUpperCase().replace(/\s+/g, '_');

  switch (normalized) {
    case 'NUEVO':
    case 'NEW':
      return LeadStatus.NEW;
    case 'CONTACTADO':
    case 'CONTACTED':
      return LeadStatus.CONTACTED;
    case 'CALIFICADO':
    case 'QUALIFIED':
      return LeadStatus.QUALIFIED;
    case 'CITA':
    case 'APPOINTMENT':
    case 'APPOINTMENT_BOOKED':
      return LeadStatus.APPOINTMENT_BOOKED;
    case 'SEGUIMIENTO':
    case 'FOLLOW_UP':
      return LeadStatus.FOLLOW_UP;
    case 'CERRADO':
    case 'CLOSED_WON':
      return LeadStatus.CLOSED_WON;
    case 'PERDIDO':
    case 'CLOSED_LOST':
      return LeadStatus.CLOSED_LOST;
    case 'ARCHIVED':
      return LeadStatus.ARCHIVED;
    default:
      return LeadStatus.NEW;
  }
}

export async function createFollowUpReminder(params: {
  leadId: string;
  scheduledFor: Date;
  message?: string | null;
  channel?: string | null;
  createdByUserId?: string | null;
  appointmentId?: string | null;
  conversationId?: string | null;
}) {
  return prisma.leadReminder.create({
    data: {
      leadId: params.leadId,
      appointmentId: params.appointmentId ?? null,
      conversationId: params.conversationId ?? null,
      createdByUserId: params.createdByUserId ?? null,
      channel: params.channel ?? 'whatsapp',
      status: ReminderStatus.PENDING,
      message: params.message ?? 'Recuerda seguir con este lead y confirmar la próxima acción.',
      scheduledFor: params.scheduledFor,
    },
  });
}

export async function ensureConversationForLead(params: {
  tiendaId: string;
  leadId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  metaCategory?: string | null;
}) {
  const phone = normalizePhone(params.clientPhone);

  if (!phone) {
    return null;
  }

  const existing = await prisma.conversation.findUnique({
    where: {
      tiendaId_clientPhone: {
        tiendaId: params.tiendaId,
        clientPhone: phone,
      },
    },
  });

  if (existing) {
    if (params.leadId && existing.leadId !== params.leadId) {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: {
          leadId: params.leadId,
          clientName: params.clientName ?? existing.clientName,
          metaCategory: params.metaCategory ?? existing.metaCategory,
        },
      });
    }

    return existing;
  }

  return prisma.conversation.create({
    data: {
      tiendaId: params.tiendaId,
      leadId: params.leadId ?? null,
      clientPhone: phone,
      clientName: params.clientName ?? null,
      status: ConversationStatus.ACTIVE,
      metaCategory: params.metaCategory ?? null,
    },
  });
}

export async function createLeadPipelineActivity(params: {
  leadId: string;
  type: ActivityType;
  summary?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: params.leadId,
      actorUserId: params.actorUserId ?? null,
      type: params.type,
      summary: params.summary ?? null,
      metadataJson: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

export async function createLeadFromInbound(params: {
  tiendaId: string;
  nombre?: string | null;
  phone?: string | null;
  email?: string | null;
  motivo?: string | null;
  source?: LeadSourceInput;
  priority?: string | null;
  assignedToUserId?: string | null;
  createdByUserId?: string | null;
  messageContent?: string | null;
  clientName?: string | null;
  metaCategory?: string | null;
}) {
  const normalizedPhone = normalizePhone(params.phone);
  if (!params.tiendaId) {
    throw new Error('tiendaId is required');
  }

  const existingLead = normalizedPhone
    ? await prisma.lead.findFirst({
        where: {
          tiendaId: params.tiendaId,
          phone: normalizedPhone,
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  if (existingLead) {
    await ensureConversationForLead({
      tiendaId: params.tiendaId,
      leadId: existingLead.id,
      clientPhone: normalizedPhone,
      clientName: params.clientName ?? params.nombre ?? existingLead.nombre,
      metaCategory: params.metaCategory,
    });

    if (params.motivo && !existingLead.motivo) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          motivo: params.motivo,
          email: params.email ?? existingLead.email,
          note: params.motivo,
        },
      });
    }

    return { lead: existingLead, created: false };
  }

  const lead = await prisma.lead.create({
    data: {
      tiendaId: params.tiendaId,
      nombre: params.nombre ?? params.clientName ?? 'Nuevo lead',
      phone: normalizedPhone,
      email: params.email ?? null,
      motivo: params.motivo ?? params.messageContent ?? null,
      note: params.motivo ?? params.messageContent ?? null,
      origen: normalizeLeadSource(params.source),
      prioridad: normalizeLeadPriority(params.priority),
      estado: LeadStatus.NEW,
      qualityScore: 25,
      assignedToUserId: params.assignedToUserId ?? null,
      createdByUserId: params.createdByUserId ?? null,
      metadataJson: {
        source: params.source ?? 'WHATSAPP',
        initialChannel: 'inbound',
      },
    },
  });

  const conversation = await ensureConversationForLead({
    tiendaId: params.tiendaId,
    leadId: lead.id,
    clientPhone: normalizedPhone,
    clientName: params.clientName ?? params.nombre ?? lead.nombre,
    metaCategory: params.metaCategory,
  });

  await createLeadPipelineActivity({
    leadId: lead.id,
    type: ActivityType.LEAD_CREATED,
    summary: `Lead creado desde ${params.source ?? 'WHATSAPP'}${params.messageContent ? ' con mensaje inicial' : ''}`,
    actorUserId: params.createdByUserId ?? null,
    metadata: {
      conversationId: conversation?.id ?? null,
      source: params.source ?? 'WHATSAPP',
    },
  });

  if (params.messageContent) {
    await prisma.message.create({
      data: {
        conversationId: conversation?.id ?? '',
        senderRole: 'USER',
        direction: MessageDirection.INBOUND,
        messageType: 'text',
        content: params.messageContent,
        status: MessageStatus.DELIVERED,
      },
    });
  }

  return { lead, conversation, created: true };
}

export async function createAppointmentFromLead(params: {
  tiendaId: string;
  leadId?: string | null;
  conversationId?: string | null;
  clienteNombre: string;
  clienteTelefono: string;
  fechaHora: Date;
  assignedToUserId?: string | null;
  createdByUserId?: string | null;
  location?: string | null;
  notes?: string | null;
  source?: string | null;
}) {
  if (!params.tiendaId) {
    throw new Error('tiendaId is required');
  }

  const normalizedPhone = normalizePhone(params.clienteTelefono);
  if (!normalizedPhone) {
    throw new Error('clienteTelefono is required');
  }

  let lead = params.leadId ? await prisma.lead.findUnique({ where: { id: params.leadId } }) : null;

  if (!lead && params.conversationId) {
    const conversation = await prisma.conversation.findUnique({ where: { id: params.conversationId } });
    if (conversation) {
      lead = await prisma.lead.findUnique({ where: { id: conversation.leadId ?? '' } });
    }
  }

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        tiendaId: params.tiendaId,
        nombre: params.clienteNombre,
        phone: normalizedPhone,
        motivo: params.notes ?? 'Cita agendada desde agenda operativa',
        note: params.notes ?? 'Cita agendada desde agenda operativa',
        origen: LeadSource.MANUAL,
        estado: LeadStatus.APPOINTMENT_BOOKED,
        prioridad: LeadPriority.MEDIUM,
        assignedToUserId: params.assignedToUserId ?? null,
        createdByUserId: params.createdByUserId ?? null,
      },
    });
  }

  const appointment = await prisma.cita.create({
    data: {
      tiendaId: params.tiendaId,
      leadId: lead.id,
      conversationId: params.conversationId ?? null,
      assignedToUserId: params.assignedToUserId ?? null,
      clienteNombre: params.clienteNombre,
      clienteTelefono: normalizedPhone,
      fechaHora: params.fechaHora,
      estado: AppointmentStatus.CONFIRMED,
      durationMinutes: 30,
      location: params.location ?? null,
      notes: params.notes ?? null,
      source: params.source ?? 'manual',
      createdByUserId: params.createdByUserId ?? null,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      estado: LeadStatus.APPOINTMENT_BOOKED,
      lastContactAt: new Date(),
      assignedToUserId: params.assignedToUserId ?? lead.assignedToUserId,
    },
  });

  const reminderDate = new Date(params.fechaHora.getTime() - 24 * 60 * 60 * 1000);
  await createFollowUpReminder({
    leadId: lead.id,
    scheduledFor: reminderDate,
    message: `Recordatorio: tienes una cita agendada para ${params.fechaHora.toISOString()}. Confirma el seguimiento con el cliente.`,
    channel: 'whatsapp',
    createdByUserId: params.createdByUserId ?? null,
    appointmentId: appointment.id,
    conversationId: params.conversationId ?? null,
  });

  await createLeadPipelineActivity({
    leadId: lead.id,
    type: ActivityType.APPOINTMENT_CREATED,
    summary: `Cita agendada para ${params.fechaHora.toISOString()}`,
    actorUserId: params.createdByUserId ?? null,
    metadata: { appointmentId: appointment.id, date: params.fechaHora.toISOString() },
  });

  return { lead, appointment };
}

export async function createLeadReminder(params: {
  leadId: string;
  scheduledFor: Date;
  message?: string | null;
  channel?: string | null;
  createdByUserId?: string | null;
  appointmentId?: string | null;
  conversationId?: string | null;
}) {
  return prisma.leadReminder.create({
    data: {
      leadId: params.leadId,
      appointmentId: params.appointmentId ?? null,
      conversationId: params.conversationId ?? null,
      createdByUserId: params.createdByUserId ?? null,
      channel: params.channel ?? 'whatsapp',
      status: ReminderStatus.PENDING,
      message: params.message ?? 'Te recordamos tu próxima atención.',
      scheduledFor: params.scheduledFor,
    },
  });
}

export async function runLeadAutomation(params: { tiendaId?: string | null; limit?: number } = {}) {
  const now = new Date();
  const limit = params.limit ?? 50;

  const dueReminders = await prisma.leadReminder.findMany({
    where: {
      status: ReminderStatus.PENDING,
      scheduledFor: { lte: now },
      ...(params.tiendaId ? { lead: { tiendaId: params.tiendaId } } : {}),
    },
    include: {
      lead: true,
      appointment: true,
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
  });

  let processed = 0;
  let transformedLeads = 0;

  for (const reminder of dueReminders) {
    await prisma.leadReminder.update({
      where: { id: reminder.id },
      data: {
        status: ReminderStatus.SENT,
        sentAt: now,
      },
    });

    await createLeadPipelineActivity({
      leadId: reminder.leadId,
      type: ActivityType.REMINDER_SENT,
      summary: reminder.message ?? 'Recordatorio automático enviado',
      actorUserId: reminder.createdByUserId ?? null,
      metadata: {
        reminderId: reminder.id,
        channel: reminder.channel,
        scheduledFor: reminder.scheduledFor.toISOString(),
      },
    });

    if (reminder.lead.estado === LeadStatus.NEW) {
      await prisma.lead.update({
        where: { id: reminder.leadId },
        data: {
          estado: LeadStatus.CONTACTED,
          lastContactAt: now,
        },
      });
      transformedLeads += 1;
    }

    processed += 1;
  }

  const staleLeads = await prisma.lead.findMany({
    where: {
      ...(params.tiendaId ? { tiendaId: params.tiendaId } : {}),
      estado: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED] },
      lastContactAt: { lte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2) },
    },
    select: { id: true },
    take: limit,
  });

  let createdFollowUps = 0;
  for (const lead of staleLeads) {
    const activeReminder = await prisma.leadReminder.findFirst({
      where: {
        leadId: lead.id,
        status: ReminderStatus.PENDING,
      },
      orderBy: { scheduledFor: 'desc' },
    });

    if (activeReminder) continue;

    await createFollowUpReminder({
      leadId: lead.id,
      scheduledFor: new Date(now.getTime() + 1000 * 60 * 60 * 12),
      message: 'Seguimiento pendiente: requiere respuesta y avance en el pipeline para evitar pérdida del lead.',
      channel: 'whatsapp',
    });

    createdFollowUps += 1;
  }

  return {
    processed,
    transformedLeads,
    createdFollowUps,
    pendingReminders: processed,
  };
}

export async function assignLeadToUser(params: {
  leadId: string;
  userId: string;
  assignedByUserId?: string | null;
  reason?: string | null;
  status?: LeadStatus | string | null;
}) {
  const nextStatus = params.status ? normalizeLeadStatus(params.status) : LeadStatus.CONTACTED;

  const lead = await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      assignedToUserId: params.userId,
      estado: nextStatus,
      lastContactAt: new Date(),
    },
  });

  const assignment = await prisma.leadAssignment.create({
    data: {
      leadId: params.leadId,
      userId: params.userId,
      assignedByUserId: params.assignedByUserId ?? null,
      status: 'active',
      reason: params.reason ?? null,
    },
  });

  const reminderAt = new Date(Date.now() + 60 * 60 * 1000);
  await createFollowUpReminder({
    leadId: params.leadId,
    scheduledFor: reminderAt,
    message: 'Seguimiento de lead: revisa el estado del cliente y responde por WhatsApp.',
    channel: 'whatsapp',
    createdByUserId: params.assignedByUserId ?? null,
  });

  await createLeadPipelineActivity({
    leadId: params.leadId,
    type: ActivityType.LEAD_ASSIGNED,
    summary: `Lead asignado al usuario ${params.userId}`,
    actorUserId: params.assignedByUserId ?? null,
    metadata: { assignmentId: assignment.id, userId: params.userId },
  });

  return { lead, assignment };
}
