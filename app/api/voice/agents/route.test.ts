import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { VOICE_PRIVACY_NOTICE } from '@/lib/telnyx/voice-consent';

vi.mock('@/lib/prisma', () => ({
  prisma: { tienda: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/telnyx/client', () => ({
  upsertAssistantForTienda: vi.fn(),
  updateAssistantVoice: vi.fn(),
  getTelnyxConfig: vi.fn(() => ({ assistantId: '' })),
  isTelnyxVoiceReady: vi.fn(),
  missingTelnyxVoiceEnv: vi.fn(() => []),
  telnyxNotReadyMessage: vi.fn(
    (missing: string[]) => `Telnyx no está configurado: falta ${missing.join(', ')}`
  ),
}));

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import {
  getTelnyxConfig,
  isTelnyxVoiceReady,
  missingTelnyxVoiceEnv,
  upsertAssistantForTienda,
} from '@/lib/telnyx/client';
import { POST } from './route';

const mockedSession = getSessionUser as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;
const mockedTiendaUpdate = prisma.tienda.update as unknown as Mock;
const mockedVoiceReady = isTelnyxVoiceReady as unknown as Mock;
const mockedMissing = missingTelnyxVoiceEnv as unknown as Mock;
const mockedUpsert = upsertAssistantForTienda as unknown as Mock;
const mockedConfig = getTelnyxConfig as unknown as Mock;

const TIENDA = { id: 'tienda-1', userId: 'user-1', nombre: 'Clínica Andes' };

const body = {
  tiendaId: 'tienda-1',
  nombre: 'Sofía',
  reglas: 'Atiende consultas de agenda y confirma datos con lectura dígito a dígito.',
  nicho: 'salud',
};

const post = (payload: unknown) =>
  new NextRequest('http://localhost/api/voice/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStore();
  mockedSession.mockResolvedValue({ id: 'user-1' });
  mockedTiendaFind.mockResolvedValue(TIENDA);
  // Prisma devuelve la fila ya actualizada: el eco permite afirmar sobre lo que
  // la ruta realmente responde, no sobre un mock fijo.
  mockedTiendaUpdate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ ...TIENDA, ...data })
  );
  mockedVoiceReady.mockReturnValue(true);
  mockedMissing.mockReturnValue([]);
  mockedUpsert.mockResolvedValue({ data: { id: 'assistant-1' } });
  mockedConfig.mockReturnValue({ assistantId: '' });
});

describe('POST /api/voice/agents — el paso que enciende la voz', () => {
  it('exige sesión y bloquea al revisor externo', async () => {
    mockedSession.mockResolvedValue(null);
    expect((await POST(post(body))).status).toBe(401);

    mockedSession.mockResolvedValue({ id: 'meta-reviewer' });
    expect((await POST(post(body))).status).toBe(403);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('no acepta tienda ajena', async () => {
    mockedTiendaFind.mockResolvedValue(null);
    const res = await POST(post(body));
    expect(res.status).toBe(404);
    expect(mockedTiendaFind).toHaveBeenCalledWith({
      where: { id: 'tienda-1', userId: 'user-1' },
    });
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('exige nombre e instrucciones con longitud mínima', async () => {
    expect((await POST(post({ ...body, nombre: 'A' }))).status).toBe(400);
    expect((await POST(post({ ...body, reglas: 'corto' }))).status).toBe(400);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('el saludo que se manda a Telnyx encabeza con el aviso de privacidad', async () => {
    await POST(post(body));
    const sent = mockedUpsert.mock.calls[0][0];
    expect(sent.greeting.startsWith(VOICE_PRIVACY_NOTICE)).toBe(true);
    expect(sent.greeting).toContain('Sofía');
    expect(sent.greeting).toContain('Clínica Andes');
  });

  it('guarda assistant, guion y activa la voz de la sede', async () => {
    const res = await POST(post(body));
    expect(res.status).toBe(200);
    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { id: 'tienda-1' },
      data: expect.objectContaining({
        telnyxAssistantId: 'assistant-1',
        agentName: 'Sofía',
        isTelnyxActive: true,
      }),
    });
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(payload.assistantId).toBe('assistant-1');
  });

  it('fija la línea dedicada cuando se envía', async () => {
    const res = await POST(post({ ...body, telnyxPhoneNumber: '+573001112233' }));
    expect(res.status).toBe(200);
    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { id: 'tienda-1' },
      data: expect.objectContaining({ telnyxPhoneNumber: '+573001112233' }),
    });
    expect((await res.json()).telnyxPhoneNumber).toBe('+573001112233');
  });

  it('rechaza una línea que no sea E.164', async () => {
    const res = await POST(post({ ...body, telnyxPhoneNumber: '3001112233' }));
    expect(res.status).toBe(400);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('si falta la API key lo dice y no llama a Telnyx', async () => {
    mockedVoiceReady.mockReturnValue(false);
    mockedMissing.mockReturnValue(['TELNYX_API_KEY']);
    const res = await POST(post(body));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain('TELNYX_API_KEY');
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('si Telnyx falla, apaga la voz y responde 502 sin filtrar el detalle', async () => {
    mockedUpsert.mockRejectedValue(new Error('502 upstream: key rejected'));
    const res = await POST(post(body));
    expect(res.status).toBe(502);
    expect((await res.json()).error).not.toMatch(/key rejected/);
    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { id: 'tienda-1' },
      data: expect.objectContaining({ isTelnyxActive: false }),
    });
  });

  it('devuelve 429 al reintentar el aprovisionamiento en bucle', async () => {
    for (let i = 0; i < 10; i += 1) await POST(post(body));
    const res = await POST(post(body));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
