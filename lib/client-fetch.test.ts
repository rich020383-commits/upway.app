import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJson, FriendlyError, FETCH_FALLBACKS } from './client-fetch';

const originalFetch = global.fetch;

function resp(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('fetchJson', () => {
  it('NUNCA filtra el TypeError crudo del navegador al cliente', async () => {
    // Lo que realmente pasó en producción: la promesa de fetch se rechaza.
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

    await expect(fetchJson('/api/voice/voices')).rejects.toThrow(
      /No pudimos conectarnos con el servicio/
    );
    await expect(fetchJson('/api/voice/voices')).rejects.not.toThrow(/Failed to fetch/);
  });

  it('una caída de red no se reporta como error del usuario', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;
    const error = (await fetchJson('/api/voice/voices').catch((e: unknown) => e)) as Error;
    expect(error.message).toContain('Revisa tu conexión');
    expect(error.message).not.toContain('Failed');
  });

  it('401 dice que la sesión venció, no que hay un error', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(401, { error: 'No hay sesión activa' })) as unknown as typeof fetch;
    await expect(fetchJson('/api/voice/voices')).rejects.toThrow(/sesión venció/i);
  });

  it('usa el mensaje del servidor cuando viene uno honesto', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(resp(503, { error: 'El servicio de voz de Upway todavía no está disponible.' })) as unknown as typeof fetch;
    await expect(fetchJson('/api/voice/voices')).rejects.toThrow(/todavía no está disponible/);
  });

  it('si el servidor devuelve HTML en vez de JSON, no lo culpa al cliente', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    } as unknown as Response) as unknown as typeof fetch;

    await expect(fetchJson('/api/voice/voices')).rejects.toThrow(/no respondió correctamente/);
  });

  it('si el error no trae mensaje, usa el fallback de la operación', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(500, {})) as unknown as typeof fetch;
    await expect(fetchJson('/api/voice/voices', { fallback: FETCH_FALLBACKS.voz })).rejects.toThrow(
      FETCH_FALLBACKS.voz
    );
  });

  it('devuelve el JSON cuando todo sale bien', async () => {
    global.fetch = vi.fn().mockResolvedValue(resp(200, { voices: [] })) as unknown as typeof fetch;
    await expect(fetchJson<{ voices: unknown[] }>('/api/voice/voices')).resolves.toEqual({ voices: [] });
  });

  it('los errores que lanza son FriendlyError, no TypeError', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;
    const error = (await fetchJson('/api/voice/voices').catch((e: unknown) => e)) as Error;
    expect(error).toBeInstanceOf(FriendlyError);
    expect(error).not.toBeInstanceOf(TypeError);
  });
});
