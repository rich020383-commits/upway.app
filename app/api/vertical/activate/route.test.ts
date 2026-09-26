import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verticalOnboardingSession: { findFirst: vi.fn(), update: vi.fn() },
    tienda: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/telnyx/voice-consent', () => ({ buildVoiceGreeting: vi.fn(() => 'saludo') }));
vi.mock('@/lib/telnyx/client', () => ({
  isTelnyxVoiceReady: vi.fn(() => true),
  missingTelnyxVoiceEnv: vi.fn(() => []),
  telnyxNotReadyMessage: vi.fn(() => 'sin config'),
  upsertAssistantForTienda: vi.fn(),
}));

import { isTelnyxVoiceReady, upsertAssistantForTienda } from '@/lib/telnyx/client';
import { POST } from './route';

const mockedSesion = prisma.verticalOnboardingSession.findFirst as unknown as Mock;
const mockedSesionUpdate = prisma.verticalOnboardingSession.update as unknown as Mock;
const mockedTienda = prisma.tienda.findFirst as unknown as Mock;
const mockedTiendaUpdate = prisma.tienda.update as unknown as Mock;
const mockedUpsert = upsertAssistantForTienda as unknown as Mock;
const mockedReady = isTelnyxVoiceReady as unknown as Mock;

const TOKEN = 'token-interno-de-prueba';

const pedir = (body: unknown, token: string | null = TOKEN) =>
  new NextRequest('http://localhost/api/vertical/activate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-upway-internal-token': token } : {}),
    },
  });

const CUERPO = { segment: 'inmobiliaria', caseRef: 'UPW-ONB-ABC123', telefono: '+573001112233' };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.UPWAY_INTERNAL_TOKEN = TOKEN;
  mockedSesion.mockResolvedValue({
    id: 'vos-1',
    userId: 'user-1',
    status: 'PENDING_REVIEW',
    answers: JSON.stringify({ empresa: 'Inmobiliaria Norte', tarea: 'Agendar visitas' }),
  });
  mockedSesionUpdate.mockResolvedValue({ id: 'vos-1' });
  mockedTienda.mockResolvedValue({ id: 'tienda-1', nombre: 'Inmobiliaria Norte', telnyxAssistantId: null });
  mockedTiendaUpdate.mockResolvedValue({ id: 'tienda-1' });
  mockedUpsert.mockResolvedValue({ data: { id: 'assistant-nuevo' } });
  mockedReady.mockReturnValue(true);
});

afterEach(() => {
  delete process.env.UPWAY_INTERNAL_TOKEN;
});

describe('POST /api/vertical/activate — autenticación', () => {
  it('se DESHABILITA si falta el token interno, nunca queda abierta', async () => {
    // La peor versión de este endpoint sería "si no hay token, pasa".
    delete process.env.UPWAY_INTERNAL_TOKEN;
    const res = await POST(pedir(CUERPO, 'cualquier-cosa'));
    expect(res.status).toBe(503);
    expect(mockedSesionUpdate).not.toHaveBeenCalled();
  });

  it('rechaza un token incorrecto con 401', async () => {
    const res = await POST(pedir(CUERPO, 'token-incorrecto'));
    expect(res.status).toBe(401);
    expect(mockedSesionUpdate).not.toHaveBeenCalled();
  });

  it('rechaza una petición sin cabecera de token', async () => {
    expect((await POST(pedir(CUERPO, null))).status).toBe(401);
  });
});


describe('POST /api/vertical/activate — el ciclo que faltaba', () => {
  it('lleva el caso de PENDING_REVIEW a ACTIVE y enciende la sede', async () => {
    const res = await POST(pedir(CUERPO));
    expect(res.status).toBe(200);

    // Las dos transiciones que antes no existían para las verticales.
    const estados = mockedSesionUpdate.mock.calls.map((c) => c[0].data.status);
    expect(estados).toEqual(['APPROVED', 'ACTIVE']);

    const sede = mockedTiendaUpdate.mock.calls[0][0].data;
    expect(sede.telnyxPhoneNumber).toBe('+573001112233');
    expect(sede.telnyxAssistantId).toBe('assistant-nuevo');
    expect(sede.isTelnyxActive).toBe(true);
    expect(sede.segment).toBe('inmobiliaria');
  });

  it('arma el prompt con las palabras del cliente, no con una plantilla', async () => {
    await POST(pedir(CUERPO));
    const instrucciones = mockedUpsert.mock.calls[0][0].instructions;
    expect(instrucciones).toContain('Inmobiliaria Norte');
    expect(instrucciones).toContain('Agendar visitas');
  });

  it('respeta un prompt y una voz enviados explícitamente', async () => {
    await POST(pedir({ ...CUERPO, systemPrompt: 'Reglas mías', voice: 'Telnyx.KokoroTTS.em_alex' }));
    const args = mockedUpsert.mock.calls[0][0];
    expect(args.instructions).toContain('Reglas mías');
    expect(args.voice).toBe('Telnyx.KokoroTTS.em_alex');
  });

  it('con soloAprobar aprueba SIN encender la voz', async () => {
    // Aprobar es un acto comercial; prender la voz es técnico. Se pueden dar
    // por separado para no bloquear a quien ya pagó.
    const res = await POST(pedir({ ...CUERPO, soloAprobar: true }));
    expect(res.status).toBe(200);
    expect(mockedSesionUpdate.mock.calls[0][0].data.status).toBe('APPROVED');
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('si Telnyx falla, el caso QUEDA APROBADO para poder reintentar', async () => {
    mockedUpsert.mockRejectedValue(new Error('502 upstream'));
    const res = await POST(pedir(CUERPO));
    expect(res.status).toBe(502);
    expect((await res.json()).status).toBe('APPROVED');
    // La sede no se toca con datos a medias.
    expect(mockedTiendaUpdate).not.toHaveBeenCalled();
  });

  it('deja el caso APPROVED y avisa cuando falta configuración de Telnyx', async () => {
    mockedReady.mockReturnValue(false);
    const res = await POST(pedir(CUERPO));
    expect(res.status).toBe(207);
    expect(mockedSesionUpdate.mock.calls[0][0].data.status).toBe('APPROVED');
  });

  it('es idempotente: reintentar un caso ya ACTIVE no hace nada', async () => {
    mockedSesion.mockResolvedValue({ id: 'vos-1', userId: 'user-1', status: 'ACTIVE', answers: '{}' });
    expect((await (await POST(pedir(CUERPO))).json()).yaActivo).toBe(true);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('valida el cuerpo antes de tocar nada', async () => {
    expect((await POST(pedir({ segment: 'inmobiliaria', caseRef: 'X' }))).status).toBe(400);
    expect((await POST(pedir({ ...CUERPO, telefono: '3001112233' }))).status).toBe(400);
    expect((await POST(pedir({ ...CUERPO, segment: 'otro' as never }))).status).toBe(400);
    expect(mockedSesionUpdate).not.toHaveBeenCalled();
  });

  it('404 si el caseRef no existe, sin aprobar nada', async () => {
    mockedSesion.mockResolvedValue(null);
    expect((await POST(pedir(CUERPO))).status).toBe(404);
    expect(mockedSesionUpdate).not.toHaveBeenCalled();
  });
});
