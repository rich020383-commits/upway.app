import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  TELNYX_CALL_ENV,
  TELNYX_REQUIRED_ENV,
  TELNYX_VOICE_ENV,
  isTelnyxCallReady,
  isTelnyxVoiceReady,
  missingTelnyxCallEnv,
  missingTelnyxVoiceEnv,
  telnyxNotReadyMessage,
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

  it('el mensaje nombra exactamente la env que falta, sin inventar otras', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    const message = telnyxNotReadyMessage(missingTelnyxCallEnv());
    expect(message).toBe(
      'Telnyx no está configurado: falta TELNYX_APP_ID, TELNYX_DEFAULT_PHONE_NUMBER'
    );
    expect(message).not.toContain('TELNYX_API_KEY');
  });

  it('TELNYX_REQUIRED_ENV es la unión de los dos gates, sin repetir', () => {
    expect([...TELNYX_REQUIRED_ENV]).toEqual([
      'TELNYX_API_KEY',
      'TELNYX_APP_ID',
      'TELNYX_DEFAULT_PHONE_NUMBER',
    ]);
  });
});
