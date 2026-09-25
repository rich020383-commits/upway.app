import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { VOICE_RATE_RULES } from '@/lib/telnyx/rate-limit';
import { CALL_CONSENT_REQUIRED_MESSAGE } from '@/lib/telnyx/voice-consent';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tienda: { findFirst: vi.fn() },
    llamadaLog: { create: vi.fn() },
  },
}));
vi.mock('@/lib/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/telnyx/client', () => ({
  isTelnyxCallReady: vi.fn(),
  missingTelnyxCallEnv: vi.fn(),
  telnyxNotReadyMessage: vi.fn(),
  createOutboundCall: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import {
  createOutboundCall,
  isTelnyxCallReady,
  missingTelnyxCallEnv,
  telnyxNotReadyMessage,
} from '@/lib/telnyx/client';
import { POST } from './route';

const mockedSession = getSessionUser as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;
const mockedLogCreate = prisma.llamadaLog.create as unknown as Mock;
const mockedCallReady = isTelnyxCallReady as unknown as Mock;
const mockedMissing = missingTelnyxCallEnv as unknown as Mock;
const mockedNotReady = telnyxNotReadyMessage as unknown as Mock;
const mockedCall = createOutboundCall as unknown as Mock;

const TIENDA = {
  id: 'tienda-1',
  userId: 'user-1',
  telnyxPhoneNumber: '+573001112233',
  telnyxAssistantId: 'assistant-1',
};

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/voice/calls', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const validBody = { tiendaId: 'tienda-1', to: '+573123456789', consent: true };

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStore();
  mockedSession.mockResolvedValue({ id: 'user-1' });
  mockedTiendaFind.mockResolvedValue(TIENDA);
  mockedLogCreate.mockResolvedValue({});
  mockedCallReady.mockReturnValue(true);
  mockedMissing.mockReturnValue([]);
  mockedNotReady.mockImplementation(
    (missing: string[]) => `Telnyx no está configurado: falta ${missing.join(', ')}`
  );
  mockedCall.mockResolvedValue({ data: { id: 'call-1' } });
});

describe('POST /api/voice/calls — sesión, ownership, consentimiento y cuota', () => {
  it('responde 401 sin sesión y no consume la ventana de cuota', async () => {
    mockedSession.mockResolvedValue(null);
    const res = await POST(request(validBody));
    expect(res.status).toBe(401);
    // Nada llegó a Telnyx.
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('bloquea al revisor externo', async () => {
    mockedSession.mockResolvedValue({ id: 'meta-reviewer' });
    const res = await POST(request(validBody));
    expect(res.status).toBe(403);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('rechaza la llamada sin consentimiento atestiguado', async () => {
    const sinConsentimiento: Record<string, unknown> = { ...validBody };
    delete sinConsentimiento.consent;
    const res = await POST(request(sinConsentimiento));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(CALL_CONSENT_REQUIRED_MESSAGE);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('rechaza consentimiento explícitamente en false', async () => {
    const res = await POST(request({ ...validBody, consent: false }));
    expect(res.status).toBe(400);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('valida el formato E.164 del destino', async () => {
    const res = await POST(request({ ...validBody, to: '3123456789' }));
    expect(res.status).toBe(400);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('devuelve 404 si la tienda no pertenece al usuario de la sesión', async () => {
    mockedTiendaFind.mockResolvedValue(null);
    const res = await POST(request(validBody));
    expect(res.status).toBe(404);
    expect(mockedCall).not.toHaveBeenCalled();
    expect(mockedTiendaFind).toHaveBeenCalledWith({
      where: { id: 'tienda-1', userId: 'user-1' },
    });
  });

  it('explica qué variable de Telnyx falta (503) sin llegar a marcar', async () => {
    mockedCallReady.mockReturnValue(false);
    mockedMissing.mockReturnValue(['TELNYX_DEFAULT_PHONE_NUMBER']);
    const res = await POST(request(validBody));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain('TELNYX_DEFAULT_PHONE_NUMBER');
    expect(mockedCall).not.toHaveBeenCalled();
    // El gate consulta con el número de la tienda: si la tienda ya tiene uno
    // dedicado, la env global deja de ser obligatoria.
    expect(mockedCallReady).toHaveBeenCalledWith('+573001112233');
  });

  it('marca el destino con el número y el assistant de la tienda', async () => {
    const res = await POST(request(validBody));
    expect(res.status).toBe(200);
    expect(mockedCall).toHaveBeenCalledWith({
      to: '+573123456789',
      from: '+573001112233',
      assistantId: 'assistant-1',
      clientState: 'tienda-1',
    });
    expect(mockedLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tiendaId: 'tienda-1' }) })
    );
    expect((await res.json()).ok).toBe(true);
  });

  it('devuelve 429 al agotar la ventana de llamadas', async () => {
    const limit = VOICE_RATE_RULES.call.limit;
    for (let i = 0; i < limit; i += 1) {
      // Cada una consume cuota aunque el cuerpo sea inválido: el freno va
      // antes de tocar Telnyx.
      const res = await POST(request({}));
      expect(res.status).toBe(400);
    }
    const blocked = await POST(request(validBody));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    const body = await blocked.json();
    expect(body.error).toMatch(/llamadas de prueba/i);
    // Solo las que llegaron a Telnyx fueron las válidas (ninguna de estas).
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('el freno es por usuario: otra cuenta sigue teniendo su ventana', async () => {
    const limit = VOICE_RATE_RULES.call.limit;
    for (let i = 0; i < limit; i += 1) await POST(request({}));
    expect((await POST(request({}))).status).toBe(429);

    mockedSession.mockResolvedValue({ id: 'user-2' });
    expect((await POST(request({}))).status).toBe(400);
  });
});
