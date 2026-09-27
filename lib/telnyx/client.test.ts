import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TELNYX_CALL_ENV,
  TELNYX_REQUIRED_ENV,
  TELNYX_VOICE_ENV,
  isTelnyxCallReady,
  isTelnyxVoiceReady,
  missingTelnyxCallEnv,
  missingTelnyxVoiceEnv,
  telnyxNotReadyMessage,
  createOutboundCall,
  decodeClientState,
  encodeClientState,
  speakOnCall,
  upsertAssistantForTienda,
  updateAssistantVoice,
} from './client';

// Copia de seguridad de las env que la prueba manipula.
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const name of TELNYX_REQUIRED_ENV) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of TELNYX_REQUIRED_ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe('gate de voz (catálogo, preview, clones, assistant)', () => {
  it('solo necesita la API key', () => {
    expect([...TELNYX_VOICE_ENV]).toEqual(['TELNYX_API_KEY']);
    expect(missingTelnyxVoiceEnv()).toEqual(['TELNYX_API_KEY']);
    expect(isTelnyxVoiceReady()).toBe(false);
  });

  it('con la API key puesta funciona aunque falte TODO lo demás', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    // Este es el caso real de producción: sin número comprado.
    expect(process.env.TELNYX_APP_ID).toBeUndefined();
    expect(process.env.TELNYX_DEFAULT_PHONE_NUMBER).toBeUndefined();
    expect(missingTelnyxVoiceEnv()).toEqual([]);
    expect(isTelnyxVoiceReady()).toBe(true);
  });

  it('trata el valor en blanco como faltante', () => {
    process.env.TELNYX_API_KEY = '   ';
    expect(missingTelnyxVoiceEnv()).toEqual(['TELNYX_API_KEY']);
    expect(isTelnyxVoiceReady()).toBe(false);
  });
});

describe('gate de llamada (marcar)', () => {
  it('exige las tres env cuando la tienda no tiene número propio', () => {
    expect(missingTelnyxCallEnv()).toEqual([...TELNYX_CALL_ENV]);
    expect(isTelnyxCallReady()).toBe(false);
  });

  it('el número dedicado de la tienda exime de la env global', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    process.env.TELNYX_APP_ID = 'app_123';
    expect(missingTelnyxCallEnv('+573001112233')).toEqual([]);
    expect(isTelnyxCallReady('+573001112233')).toBe(true);
    // Sin número de tienda, la env global vuelve a hacer falta.
    expect(missingTelnyxCallEnv()).toEqual(['TELNYX_DEFAULT_PHONE_NUMBER']);
    expect(missingTelnyxCallEnv(null)).toEqual(['TELNYX_DEFAULT_PHONE_NUMBER']);
  });

  it('un número en blanco de la tienda NO exime de la env global', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    process.env.TELNYX_APP_ID = 'app_123';
    expect(missingTelnyxCallEnv('   ')).toEqual(['TELNYX_DEFAULT_PHONE_NUMBER']);
  });
});

describe('diagnóstico compartido', () => {
  it('devuelve solo nombres, nunca valores (seguro para exponer en un 503)', () => {
    process.env.TELNYX_API_KEY = 'KEY_super_secreta_123';
    const missing = missingTelnyxCallEnv();
    expect(missing.join(' ')).not.toContain('KEY_super_secreta_123');
    for (const name of missing) {
      expect(TELNYX_REQUIRED_ENV.some((env) => env === name)).toBe(true);
    }
  });

  it('el mensaje de cara al cliente NO nombra al proveedor ni a las variables', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    const message = telnyxNotReadyMessage(missingTelnyxCallEnv(), 'llamada');
    // Este texto se muestra en el panel del cliente: el nombre del proveedor y
    // los nombres de variable (que lo delatan) se quedan en el log del servidor.
    expect(message).not.toMatch(/telnyx/i);
    expect(message).not.toMatch(/TELNYX_/);
    expect(message).not.toMatch(/APP_ID/);
    expect(message).not.toContain('KEY_test');
    expect(message).toMatch(/Upway/);
    expect(message).toMatch(/línea/i);
  });

  it('distingue el aviso de voz del de llamada sin delatar el proveedor', () => {
    const voz = telnyxNotReadyMessage(['TELNYX_API_KEY'], 'voz');
    const llamada = telnyxNotReadyMessage(['TELNYX_DEFAULT_PHONE_NUMBER'], 'llamada');
    expect(voz).not.toBe(llamada);
    for (const texto of [voz, llamada]) {
      expect(texto).not.toMatch(/telnyx/i);
      expect(texto).not.toMatch(/[A-Z]{3,}_[A-Z_]+/); // ninguna constante de entorno
    }
  });

  it('TELNYX_REQUIRED_ENV es la unión de los dos gates, sin repetir', () => {
    expect([...TELNYX_REQUIRED_ENV]).toEqual([
      'TELNYX_API_KEY',
      'TELNYX_APP_ID',
      'TELNYX_DEFAULT_PHONE_NUMBER',
    ]);
  });
});

/**
 * AUDITORÍA: forma real de `POST /v2/ai/assistants`, verificada contra la API
 * de Telnyx el 25-sep-2026.
 *
 * Estos tests fijan tres cosas que estaban rotas y que ningún test cubría:
 *  · la ruta es `/ai/assistants`; `/ai_assistants` responde 404 y hacía que el
 *    provisionamiento de voz nunca funcionara;
 *  · la voz va DENTRO de `voice_settings.voice`; en la raíz se ignora en
 *    silencio y el asistente queda mudo sin avisar;
 *  · `model` no se manda: se fija el valor por defecto del proveedor.
 *
 * Los fixtures salen de la respuesta real de la API, no de memoria: un test
 * verde contra un payload inventado es lo que dejó pasar el bug original.
 */
describe('upsertAssistantForTienda — contrato con la API de Telnyx', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.TELNYX_API_KEY = 'clave-de-prueba';
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 'assistant-1' } }),
      headers: new Headers(),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TELNYX_API_KEY;
  });

  const cuerpoEnviado = () => {
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  };

  it('usa la ruta /ai/assistants, no /ai_assistants', async () => {
    await upsertAssistantForTienda({ name: 'Ana', greeting: 'hola', instructions: 'reglas' });
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('/v2/ai/assistants');
    // La ruta con guion bajo no existe: Telnyx responde 404.
    expect(url).not.toContain('ai_assistants');
  });

  it('manda la voz dentro de voice_settings, no en la raíz', async () => {
    await upsertAssistantForTienda({
      name: 'Ana',
      greeting: 'hola',
      instructions: 'reglas',
      voice: 'Telnyx.KokoroTTS.ef_dora',
    });
    const cuerpo = cuerpoEnviado();
    expect(cuerpo.voice_settings).toEqual({ voice: 'Telnyx.KokoroTTS.ef_dora' });
    // En la raíz se ignora en silencio: el asistente quedaría mudo.
    expect(cuerpo.voice).toBeUndefined();
  });

  it('no fija el modelo: es un valor por defecto del proveedor', async () => {
    await upsertAssistantForTienda({ name: 'Ana', greeting: 'hola', instructions: 'reglas' });
    const cuerpo = cuerpoEnviado();
    expect(cuerpo.model).toBeUndefined();
    expect(cuerpo.language).toBeUndefined();
  });

  it('si no le pasan voz, usa la predeterminada verificada (no la voz histórica)', async () => {
    await upsertAssistantForTienda({ name: 'Ana', greeting: 'hola', instructions: 'reglas' });
    const cuerpo = cuerpoEnviado() as { voice_settings: { voice: string } };
    expect(cuerpo.voice_settings.voice).toBeTruthy();
    expect(cuerpo.voice_settings.voice).not.toBe('Telnyx.female.sofia');
  });
});

describe('createOutboundCall — contrato con la API de Telnyx', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.TELNYX_API_KEY = 'clave';
    process.env.TELNYX_APP_ID = 'app-1';
    process.env.TELNYX_DEFAULT_PHONE_NUMBER = '+573001111111';
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}), headers: new Headers() });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ['TELNYX_API_KEY', 'TELNYX_APP_ID', 'TELNYX_DEFAULT_PHONE_NUMBER']) delete process.env[k];
  });

  const cuerpo = () => JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body));

  it('engancha el asistente con `assistant`, no con `ai_assistant`', async () => {
    await createOutboundCall({ to: '+573001234567', assistantId: 'assistant-7' });
    const c = cuerpo();
    // El esquema de Telnyx es CallRequest.assistant -> CallAssistantRequest.
    expect(c.assistant).toEqual({ id: 'assistant-7' });
    // Nombre inexistente: se ignoraba y la llamada no la contestaba la IA.
    expect(c.ai_assistant).toBeUndefined();
  });

  it('omite el asistente si no hay ninguno configurado', async () => {
    await createOutboundCall({ to: '+573001234567' });
    expect(cuerpo().assistant).toBeUndefined();
  });

  it('manda client_state en Base-64, como exige Telnyx', async () => {
    await createOutboundCall({ to: '+573001234567', clientState: 'tienda-1' });
    const enviado = cuerpo().client_state as string;
    expect(enviado).toBe(Buffer.from('tienda-1').toString('base64'));
    // Y el webhook lo recupera intacto.
    expect(decodeClientState(enviado)).toBe('tienda-1');
  });

  it('usa un idioma que está en el enum de Telnyx', async () => {
    await speakOnCall('v3:abc', 'hola');
    // 'es-CO' no existe en el enum (400). Las opciones son es-ES/es-MX/es-US.
    expect(cuerpo().language).toBe('es-MX');
  });
});

describe('client_state — ida y vuelta en Base-64', () => {
  it('encode y decode son inversos', () => {
    expect(decodeClientState(encodeClientState('tienda-abc-123'))).toBe('tienda-abc-123');
  });

  it('un estado vacío no inventa una tienda', () => {
    expect(encodeClientState(undefined)).toBe('');
    expect(encodeClientState(null)).toBe('');
    expect(decodeClientState('')).toBeNull();
    expect(decodeClientState(undefined)).toBeNull();
  });

  it('trunca a 64 caracteres para no exceder el campo', () => {
    const largo = 'x'.repeat(200);
    expect(decodeClientState(encodeClientState(largo))).toHaveLength(64);
  });
});

describe('updateAssistantVoice — contrato con la API de Telnyx', () => {
  it('aplica la voz en la ruta correcta y dentro de voice_settings', async () => {
    process.env.TELNYX_API_KEY = 'clave-de-prueba';
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: new Headers(),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await updateAssistantVoice('assistant-9', 'Telnyx.KokoroTTS.em_alex');

    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('/v2/ai/assistants/assistant-9');
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      voice_settings: { voice: 'Telnyx.KokoroTTS.em_alex' },
    });

    vi.unstubAllGlobals();
    delete process.env.TELNYX_API_KEY;
  });
});
