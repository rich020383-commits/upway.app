import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';

vi.mock('@/lib/telnyx/client', () => ({
  generateSpeech: vi.fn(),
  isTelnyxVoiceReady: vi.fn(),
  listTtsVoices: vi.fn(),
  missingTelnyxVoiceEnv: vi.fn(() => []),
  telnyxNotReadyMessage: vi.fn(() => 'Servicio de voz no configurado.'),
}));

import {
  generateSpeech,
  isTelnyxVoiceReady,
  listTtsVoices,
} from '@/lib/telnyx/client';
import { FALLBACK_CATALOG } from '@/lib/telnyx/voices';
import { GET, POST, resetDemoCatalogCache } from './route';

const mockedReady = isTelnyxVoiceReady as unknown as Mock;
const mockedList = listTtsVoices as unknown as Mock;
const mockedSpeech = generateSpeech as unknown as Mock;

const request = (body: unknown, ip = '203.0.113.7') =>
  new NextRequest('http://localhost/api/voice/demo', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

const getRequest = (ip = '203.0.113.7') =>
  new NextRequest('http://localhost/api/voice/demo', { headers: { 'x-forwarded-for': ip } });

const VOZ_VALIDA = FALLBACK_CATALOG[0]!.value;

describe('GET /api/voice/demo — catálogo público', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    resetDemoCatalogCache();
    mockedReady.mockReturnValue(true);
    mockedList.mockResolvedValue({
      voices: [
        { id: 'A.B.colombiana', name: 'Colombiana', provider: 'telnyx', language: 'es-CO' },
        { id: 'A.B.mexicana', name: 'Mexicana', provider: 'telnyx', language: 'es-MX' },
        { id: 'A.B.americana', name: 'Anna', provider: 'telnyx', language: 'en-US' },
      ],
    });
  });

  it('devuelve voces SIN exponer el proveedor', async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const data = (await res.json()) as { voices: Array<Record<string, unknown>> };
    expect(data.voices.length).toBeGreaterThan(0);
    for (const v of data.voices) expect(v).not.toHaveProperty('provider');
  });

  it('prioriza el español sobre el inglés (landing en español)', async () => {
    const res = await GET(getRequest());
    const data = (await res.json()) as { voices: Array<{ language?: string }> };
    const idiomas = data.voices.map((v) => (v.language ?? '').toLowerCase());
    const primerEn = idiomas.findIndex((l) => l.startsWith('en'));
    const ultimaEs = idiomas.map((l, i) => (l.startsWith('es') ? i : -1)).filter((i) => i >= 0).pop();
    if (primerEn >= 0 && ultimaEs !== undefined) expect(ultimaEs).toBeLessThan(primerEn);
  });

  it('si el proveedor no responde, sirve el catálogo verificado', async () => {
    mockedList.mockRejectedValue(new Error('red caída'));
    const res = await GET(getRequest());
    const data = (await res.json()) as { voices: unknown[] };
    expect(data.voices.length).toBe(FALLBACK_CATALOG.length);
  });

  it('frena por IP: tras el límite de la hora responde 429 con Retry-After', async () => {
    // Límite interno del route: 30 catálogos/hora por IP.
    let ultimo: Response | null = null;
    for (let i = 0; i < 31; i++) ultimo = await GET(getRequest());
    expect(ultimo?.status).toBe(429);
    expect(ultimo?.headers.get('Retry-After')).toBeTruthy();
  });
});

describe('POST /api/voice/demo — síntesis pública', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    mockedReady.mockReturnValue(true);
    mockedList.mockResolvedValue({ voices: [] });
    mockedSpeech.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      contentType: 'audio/mpeg',
    });
  });

  it('sintetiza con el proveedor y devuelve audio, no JSON', async () => {
    const res = await POST(
      request({ voice: VOZ_VALIDA, text: 'Hola, esto es una prueba de voz.' })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(mockedSpeech).toHaveBeenCalledTimes(1);
  });

  it('rechaza texto vacío o demasiado largo con 400 y sin tocar al proveedor', async () => {
    const corto = await POST(request({ voice: VOZ_VALIDA, text: '' }));
    expect(corto.status).toBe(400);
    const largo = await POST(request({ voice: VOZ_VALIDA, text: 'x'.repeat(200) }));
    expect(largo.status).toBe(400);
    expect(mockedSpeech).not.toHaveBeenCalled();
  });

  it('503 cuando la voz no está configurada (fail-closed)', async () => {
    mockedReady.mockReturnValue(false);
    const res = await POST(
      request({ voice: VOZ_VALIDA, text: 'Hola, esto es una prueba de voz.' })
    );
    expect(res.status).toBe(503);
    expect(mockedSpeech).not.toHaveBeenCalled();
  });

  it('un fallo del proveedor se vuelve 502 con mensaje amable, no un TypeError', async () => {
    mockedSpeech.mockRejectedValue(new Error('90103 upstream'));
    const res = await POST(
      request({ voice: VOZ_VALIDA, text: 'Hola, esto es una prueba de voz.' })
    );
    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('otra de la lista');
    expect(data.error).not.toContain('90103');
  });

  it('frena por IP: 8 muestras por hora y después 429 con Retry-After', async () => {
    let ultimo: Response | null = null;
    for (let i = 0; i < 9; i++) {
      ultimo = await POST(
        request({ voice: VOZ_VALIDA, text: 'Hola, esto es una prueba de voz.' }, '198.51.100.9')
      );
    }
    expect(ultimo?.status).toBe(429);
    expect(ultimo?.headers.get('Retry-After')).toBeTruthy();
    // El freno corre antes del proveedor: la novena llamada nunca llega.
    expect(mockedSpeech.mock.calls.length).toBeLessThanOrEqual(8);
  });
});
