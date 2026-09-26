import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tienda: { findFirst: vi.fn() },
    voiceCloneAuthorization: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/telnyx/client', () => ({ deleteVoiceClone: vi.fn() }));

import { getSessionUser } from '@/lib/session';
import { deleteVoiceClone } from '@/lib/telnyx/client';
import { GET, POST } from './route';

const mockedSession = getSessionUser as unknown as Mock;
const mockedTienda = prisma.tienda.findFirst as unknown as Mock;
const mockedList = prisma.voiceCloneAuthorization.findMany as unknown as Mock;
const mockedFind = prisma.voiceCloneAuthorization.findFirst as unknown as Mock;
const mockedUpdate = prisma.voiceCloneAuthorization.update as unknown as Mock;
const mockedDelete = deleteVoiceClone as unknown as Mock;

const auth = (over: Record<string, unknown> = {}) => ({
  id: 'auth-1',
  tiendaId: 'tienda-1',
  consentingName: 'Ana Pérez',
  purpose: 'Agendar visitas',
  grantedAt: new Date('2026-01-10T00:00:00Z'),
  revokedAt: null,
  revokeReason: null,
  voiceCloneId: 'clone-1',
  ...over,
});

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/voice/authorizations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockedSession.mockResolvedValue({ id: 'user-1' });
  mockedTienda.mockResolvedValue({ id: 'tienda-1' });
  mockedDelete.mockResolvedValue({ data: {} });
});

describe('GET /api/voice/authorizations', () => {
  it('responde 401 sin sesión', async () => {
    mockedSession.mockResolvedValue(null);
    expect((await GET(new NextRequest('http://localhost/api/voice/authorizations'))).status).toBe(401);
  });

  it('solo lista las autorizaciones de la sede del usuario', async () => {
    mockedList.mockResolvedValue([auth()]);
    await GET(new NextRequest('http://localhost/api/voice/authorizations'));
    expect(mockedList.mock.calls[0][0].where).toEqual({ tiendaId: 'tienda-1' });
  });

  it('NO expone documento ni hashes de evidencia', async () => {
    mockedList.mockResolvedValue([
      auth({ consentingDocument: 'CC 1.020.XXX', authorizationSha256: 'hash-auto', sampleSha256: 'hash-muestra' }),
    ]);
    const crudo = JSON.stringify(await (await GET(new NextRequest('http://localhost/api/voice/authorizations'))).json());
    expect(crudo).not.toContain('1.020.XXX');
    expect(crudo).not.toContain('hash-auto');
    expect(crudo).not.toContain('hash-muestra');
  });
});

describe('POST /api/voice/authorizations — revocación', () => {
  it('borra el clon en el proveedor y LUEGO marca la autorización', async () => {
    mockedFind.mockResolvedValue(auth());
    mockedUpdate.mockResolvedValue(auth({ revokedAt: new Date('2026-02-01T00:00:00Z') }));

    const res = await POST(post({ authorizationId: 'auth-1' }));

    expect(res.status).toBe(200);
    expect(mockedDelete).toHaveBeenCalledWith('clone-1');
    expect(mockedUpdate.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date);
  });

  it('NO registra la revocación si el proveedor falla', async () => {
    mockedFind.mockResolvedValue(auth());
    mockedDelete.mockRejectedValue(new Error('502 upstream'));

    const res = await POST(post({ authorizationId: 'auth-1' }));

    expect(res.status).toBe(502);
    // Lo importante: la fila sigue viva para que el cliente pueda reintentar.
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('no permite revocar la autorización de otra sede', async () => {
    mockedFind.mockResolvedValue(null);
    const res = await POST(post({ authorizationId: 'auth-de-otro' }));
    expect(res.status).toBe(404);
    expect(mockedDelete).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('rechaza revocar dos veces con 409, sin volver a llamar a Telnyx', async () => {
    mockedFind.mockResolvedValue(auth({ revokedAt: new Date('2026-01-20T00:00:00Z') }));
    const res = await POST(post({ authorizationId: 'auth-1' }));
    expect(res.status).toBe(409);
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('valida el cuerpo antes de tocar nada', async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect(mockedDelete).not.toHaveBeenCalled();
  });
});
