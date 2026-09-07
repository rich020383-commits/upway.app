import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks antes de importar el módulo bajo test: el route vincula prisma y
// business-ops en tiempo de importación.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    leadActivity: {
      create: vi.fn(),
    },
  },
}));
vi.mock('@/lib/business-ops', () => ({
  assignLeadToUser: vi.fn(),
  createLeadFromInbound: vi.fn(),
  normalizeLeadStatus: (s: string) => s,
  toJson: (v: unknown) => v ?? {},
}));
// 🔐 Mock del guard de sesión/tenancy: por defecto permite; cada test de auth
// lo sobreescribe con una respuesta de error (401/404).
vi.mock('@/lib/session', () => ({
  getOwnedTienda: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { assignLeadToUser, createLeadFromInbound } from '@/lib/business-ops';
import { getOwnedTienda } from '@/lib/session';
import { GET, POST, PATCH } from './route';

const mockedFindMany = prisma.lead.findMany as unknown as Mock;
const mockedLeadUpdate = prisma.lead.update as unknown as Mock;
const mockedActivityCreate = prisma.leadActivity.create as unknown as Mock;
const mockedCreateLead = createLeadFromInbound as unknown as Mock;
const mockedAssign = assignLeadToUser as unknown as Mock;
const mockedOwnedTienda = getOwnedTienda as unknown as Mock;
const mockedLeadFindUnique = prisma.lead.findUnique as unknown as Mock;

const LEAD = { id: 'lead-1', tiendaId: 'tienda-1', estado: 'NEW' };
const TIENDA = { id: 'tienda-1', userId: 'user-1' };

const authError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status });

const jsonRequest = (url: string, body: unknown, method = 'POST') =>
  new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockedOwnedTienda.mockResolvedValue({ tienda: TIENDA });
  // PATCH busca el lead para resolver su tienda y validar propiedad.
  mockedLeadFindUnique.mockResolvedValue({ tiendaId: TIENDA.id });
  mockedFindMany.mockResolvedValue([LEAD]);
  mockedCreateLead.mockResolvedValue({ created: true, lead: LEAD, conversation: { id: 'conv-1' } });
  mockedAssign.mockResolvedValue({ lead: LEAD, assignment: { id: 'asg-1' } });
  mockedLeadUpdate.mockResolvedValue({ ...LEAD, estado: 'APPOINTMENT_BOOKED' });
  mockedActivityCreate.mockResolvedValue({});
});

describe('GET /api/business/leads', () => {
  it('scopes the query to the owned tienda derived from tiendaId', async () => {
    const res = await GET(new NextRequest('http://localhost/api/business/leads?tiendaId=tienda-1'));
    expect(res.status).toBe(200);
    expect(mockedOwnedTienda).toHaveBeenCalledWith(
      expect.anything(),
      prisma,
      'tienda-1',
    );
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tiendaId: 'tienda-1' } }),
    );
  });

  it('falls back to the caller\'s first owned tienda when tiendaId is omitted', async () => {
    mockedOwnedTienda.mockResolvedValue({ tienda: { ...TIENDA, id: 'tienda-otra' } });
    const res = await GET(new NextRequest('http://localhost/api/business/leads'));
    expect(res.status).toBe(200);
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tiendaId: 'tienda-otra' } }),
    );
  });

  it('returns 401 when there is no active session', async () => {
    mockedOwnedTienda.mockResolvedValue({ error: authError(401, 'No hay sesión activa') });
    const res = await GET(new NextRequest('http://localhost/api/business/leads'));
    expect(res.status).toBe(401);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it('returns 404 when the tienda does not belong to the caller', async () => {
    mockedOwnedTienda.mockResolvedValue({ error: authError(404, 'Tienda no encontrada para este usuario') });
    const res = await GET(new NextRequest('http://localhost/api/business/leads?tiendaId=ajena'));
    expect(res.status).toBe(404);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it('returns 500 on DB error', async () => {
    mockedFindMany.mockRejectedValue(new Error('db down'));
    const res = await GET(new NextRequest('http://localhost/api/business/leads'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/business/leads', () => {
  it('returns 400 when tiendaId is missing', async () => {
    const res = await POST(jsonRequest('http://localhost/api/business/leads', { nombre: 'x' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Body inválido', fieldErrors: { tiendaId: expect.anything() } });
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('returns 400 with fieldErrors for wrong field types', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/business/leads', {
        tiendaId: 'tienda-1',
        priority: 'SUPER_URGENTE', // no está en el enum
        email: 'no-es-un-email',
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Body inválido');
    expect(Object.keys(data.fieldErrors)).toEqual(
      expect.arrayContaining(['priority', 'email']),
    );
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('creates a lead when the body is valid and the tienda is owned', async () => {
    const body = { tiendaId: 'tienda-1', nombre: 'Cliente', phone: '+573001112223', priority: 'HIGH' };
    const res = await POST(jsonRequest('http://localhost/api/business/leads', body));
    expect(res.status).toBe(200);
    expect(mockedOwnedTienda).toHaveBeenCalledWith(expect.anything(), prisma, 'tienda-1');
    expect(mockedCreateLead).toHaveBeenCalledWith(expect.objectContaining(body));
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.created).toBe(true);
  });

  it('returns 401 on POST when there is no session', async () => {
    mockedOwnedTienda.mockResolvedValue({ error: authError(401, 'No hay sesión activa') });
    const res = await POST(jsonRequest('http://localhost/api/business/leads', { tiendaId: 'tienda-1' }));
    expect(res.status).toBe(401);
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('returns 404 on POST when the tienda is not owned by the caller', async () => {
    mockedOwnedTienda.mockResolvedValue({ error: authError(404, 'Tienda no encontrada para este usuario') });
    const res = await POST(jsonRequest('http://localhost/api/business/leads', { tiendaId: 'ajena' }));
    expect(res.status).toBe(404);
    expect(mockedCreateLead).not.toHaveBeenCalled();
  });

  it('returns 500 when createLeadFromInbound throws', async () => {
    mockedCreateLead.mockRejectedValue(new Error('boom'));
    const res = await POST(jsonRequest('http://localhost/api/business/leads', { tiendaId: 'tienda-1' }));
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/business/leads — status-only branch', () => {
  it('updates estado and logs STATUS_CHANGED activity when status is sent without userId', async () => {
    const res = await PATCH(
      jsonRequest(
        'http://localhost/api/business/leads',
        { leadId: 'lead-1', status: 'Cita', assignedByUserId: 'user-9', reason: 'Mover a Cita' },
        'PATCH',
      ),
    );
    expect(res.status).toBe(200);
    expect(mockedLeadUpdate).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { estado: 'Cita' },
    });
    expect(mockedActivityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        actorUserId: 'user-9',
        summary: 'Mover a Cita',
      }),
    });
    expect(mockedAssign).not.toHaveBeenCalled();
  });

  it('uses a default summary built from the updated estado when reason is omitted', async () => {
    await PATCH(
      jsonRequest('http://localhost/api/business/leads', { leadId: 'lead-1', status: 'QUALIFIED' }, 'PATCH'),
    );
    // El route construye el summary con lead.estado (el valor devuelto por
    // prisma.lead.update), no con el status crudo del request.
    expect(mockedActivityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ summary: 'Lead movido a APPOINTMENT_BOOKED' }),
    });
  });
});

describe('PATCH /api/business/leads — assignUser branch', () => {
  it('delegates to assignLeadToUser when userId is present', async () => {
    const res = await PATCH(
      jsonRequest(
        'http://localhost/api/business/leads',
        { leadId: 'lead-1', userId: 'agent-1', assignedByUserId: 'admin-1', status: 'CONTACTED' },
        'PATCH',
      ),
    );
    expect(res.status).toBe(200);
    expect(mockedAssign).toHaveBeenCalledWith({
      leadId: 'lead-1',
      userId: 'agent-1',
      assignedByUserId: 'admin-1',
      reason: undefined,
      status: 'CONTACTED',
    });
    expect(mockedLeadUpdate).not.toHaveBeenCalled();
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.lead).toEqual(LEAD);
  });

  it('returns 400 when neither status nor userId is provided', async () => {
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/leads', { leadId: 'lead-1' }, 'PATCH'),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'userId es requerido para asignar el lead' });
  });

  it('returns 400 when leadId is missing', async () => {
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/leads', { userId: 'agent-1' }, 'PATCH'),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'leadId es requerido' });
  });

  it('returns 500 when assignLeadToUser throws', async () => {
    mockedAssign.mockRejectedValue(new Error('assignment failed'));
    const res = await PATCH(
      jsonRequest('http://localhost/api/business/leads', { leadId: 'lead-1', userId: 'agent-1' }, 'PATCH'),
    );
    expect(res.status).toBe(500);
  });
});
