import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    conversation: { findFirst: vi.fn(), findUnique: vi.fn() },
    cita: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    leadActivity: { create: vi.fn() },
    leadReminder: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { createAppointmentFromLead } from './business-ops';

const Lead = prisma.lead as unknown as Record<string, Mock>;
const Conversacion = prisma.conversation as unknown as Record<string, Mock>;
const Cita = prisma.cita as unknown as Record<string, Mock>;

/**
 * AUDITORÍA (pase 3, tenancy) — IDOR de escritura cruzada.
 *
 * `createAppointmentFromLead` resolvía el lead con `findUnique({ id })`, sin
 * tiendaId. Un `leadId` de otra tienda entraba en la cita creada aquí, y al
 * confirmar, `confirmAppointment` mutaba ese lead ajeno y le colgaba actividad y
 * recordatorios. Como LeadActivity y LeadReminder heredan el tenant del lead
 * (no tienen columna propia), la escritura aterrizaba en el timeline de otro
 * cliente.
 */
const MI_TIENDA = 'tienda-mia';
const LEAD_AJENO = 'lead-de-otro-cliente';

const base = {
  tiendaId: MI_TIENDA,
  clienteNombre: 'Ana Pérez',
  clienteTelefono: '+573001234567',
  fechaHora: new Date('2026-10-01T15:00:00Z'),
};

describe('createAppointmentFromLead — el lead debe ser de esta tienda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Lead.create.mockResolvedValue({ id: 'lead-nuevo', assignedToUserId: null });
    Lead.update.mockResolvedValue({});
    Lead.updateMany.mockResolvedValue({ count: 1 });
    Conversacion.findFirst.mockResolvedValue(null);
    Cita.create.mockResolvedValue({ id: 'cita-1', leadId: 'lead-nuevo', fechaHora: base.fechaHora });
  });

  it('busca el lead acotado por tiendaId, nunca solo por id', async () => {
    Lead.findFirst.mockResolvedValue({ id: 'lead-1', assignedToUserId: null });

    await createAppointmentFromLead({ ...base, leadId: 'lead-1' });

    expect(Lead.findFirst).toHaveBeenCalledWith({
      where: { id: 'lead-1', tiendaId: MI_TIENDA },
    });
  });

  it('rechaza un leadId que pertenece a otra tienda', async () => {
    // El id existe, pero no en este tenant: la búsqueda acotada no lo encuentra.
    Lead.findFirst.mockResolvedValue(null);

    await expect(
      createAppointmentFromLead({ ...base, leadId: LEAD_AJENO }),
    ).rejects.toThrow(/no encontrado para esta tienda/i);

    // Lo importante: no se crea la cita enlazada al lead ajeno.
    expect(Cita.create).not.toHaveBeenCalled();
  });

  it('no cuelga un conversationId de otro tenant en la cita', async () => {
    Lead.findFirst.mockResolvedValue({ id: 'lead-1', assignedToUserId: null });
    // La conversación no resuelve dentro del tenant (es de otro cliente).
    Conversacion.findFirst.mockResolvedValue(null);

    await createAppointmentFromLead({ ...base, leadId: 'lead-1', conversationId: 'conv-ajena' });

    const citaCreada = Cita.create.mock.calls[0][0];
    expect(citaCreada.data.conversationId).toBeNull();
  });

  it('acepta un conversationId de la misma tienda', async () => {
    Lead.findFirst.mockResolvedValue({ id: 'lead-1', assignedToUserId: null });
    Conversacion.findFirst.mockResolvedValue({ id: 'conv-mia' });

    await createAppointmentFromLead({ ...base, leadId: 'lead-1', conversationId: 'conv-mia' });

    expect(Cita.create.mock.calls[0][0].data.conversationId).toBe('conv-mia');
  });

  it('crea un lead propio cuando no se referencia ninguno', async () => {
    await createAppointmentFromLead(base);

    // Sin leadId ni conversationId: lead nuevo del propio tenant.
    expect(Lead.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tiendaId: MI_TIENDA }) }),
    );
    expect(Cita.create.mock.calls[0][0].data.leadId).toBe('lead-nuevo');
  });
});