import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cita: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock('@/lib/business-ops', () => ({
  confirmAppointment: vi.fn(),
  createAppointmentFromLead: vi.fn(),
}));
vi.mock('@/lib/session', () => ({
  getOwnedTienda: vi.fn(),
  getSessionUser: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { confirmAppointment, createAppointmentFromLead } from '@/lib/business-ops';
import { getOwnedTienda, getSessionUser } from '@/lib/session';
import { GET, POST, PATCH } from './route';

const mockedFindMany = prisma.cita.findMany as unknown as Mock;
const mockedCreate = createAppointmentFromLead as unknown as Mock;
const mockedConfirm = confirmAppointment as unknown as Mock;
const mockedOwnedTienda = getOwnedTienda as unknown as Mock;
const mockedSessionUser = getSessionUser as unknown as Mock;

const TIENDA = { id: 'tienda-1', userId: 'user-1' };
const CITA = { id: 'cita-1', tiendaId: 'tienda-1', clienteNombre: 'Ana', estado: 'PENDING' };

const jsonRequest = (url: string, body: unknown, method = 'POST') =>
  new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockedOwnedTienda.mockResolvedValue({ tienda: TIENDA });
  mockedSessionUser.mockResolvedValue({ id: 'user-1' });
  mockedFindMany.mockResolvedValue([CITA]);
  mockedCreate.mockResolvedValue({ lead: { id: 'lead-1' }, appointment: CITA });
  mockedConfirm.mockResolvedValue({ appointment: { ...CITA, estado: 'CONFIRMED' }, alreadyConfirmed: false });
});

describe('GET /api/business/appointments', () => {
  it('scopes the query to the owned tienda', async () => {
    const res = await GET(new NextRequest('http://localhost/api/business/appointments?tiendaId=tienda-1'));
    expect(res.status).toBe(200);
    expect(mockedOwnedTienda).toHaveBeenCalledWith(expect.anything(), prisma, 'tienda-1');
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tiendaId: 'tienda-1' } }),
    );
  });
});

describe('POST /api/business/appointments', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(jsonRequest('http://localhost/api/business/appointments', { clienteNombre: 'Ana' }));
    expect(res.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates a PENDING appointment scoped to the owned tienda', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/business/appointments', {
        tiendaId: 'tienda-1',
        leadId: 'lead-1',
        clienteNombre: 'Ana',
        clienteTelefono: '+573001234567',
        fechaHora: new Date(Date.now() + 86400000).toISOString(),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ tiendaId: 'tienda-1' }));
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

describe('PATCH /api/business/appointments — confirm', () => {
  it('returns 400 when appointmentId is missing', async () => {
    const res = await PATCH(jsonRequest('http://localhost/api/business/appointments', {}, 'PATCH'));
    expect(res.status).toBe(400);
    expect(mockedConfirm).not.toHaveBeenCalled();
  });

  it('confirms scoped to the owned tienda and returns alreadyConfirmed flag', async () => {
    mockedConfirm.mockResolvedValueOnce({ appointment: CITA, alreadyConfirmed: true });
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/appointments', { appointmentId: 'cita-1' }, 'PATCH'),
    );
    expect(res.status).toBe(200);
    expect(mockedConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ tiendaId: 'tienda-1', appointmentId: 'cita-1' }),
    );
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.alreadyConfirmed).toBe(true);
  });

  it('supports citaId alias', async () => {
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/appointments', { citaId: 'cita-1' }, 'PATCH'),
    );
    expect(res.status).toBe(200);
    expect(mockedConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 'cita-1' }),
    );
  });

  it('returns 404 when the cita does not belong to the tienda', async () => {
    mockedConfirm.mockRejectedValueOnce(new Error('Cita no encontrada para esta tienda'));
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/appointments', { appointmentId: 'otra' }, 'PATCH'),
    );
    expect(res.status).toBe(404);
  });
});
