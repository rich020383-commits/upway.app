import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isTelnyxConfigured, missingTelnyxEnv, TELNYX_REQUIRED_ENV } from './client';

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

describe('missingTelnyxEnv — diagnóstico de config Telnyx', () => {
  it('lista las tres env obligatorias cuando no hay ninguna', () => {
    expect(missingTelnyxEnv()).toEqual([...TELNYX_REQUIRED_ENV]);
    expect(isTelnyxConfigured()).toBe(false);
  });

  it('quita de la lista cada env que sí está seteada', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    process.env.TELNYX_APP_ID = 'app_123';
    expect(missingTelnyxEnv()).toEqual(['TELNYX_DEFAULT_PHONE_NUMBER']);

    process.env.TELNYX_DEFAULT_PHONE_NUMBER = '+573001112233';
    expect(missingTelnyxEnv()).toEqual([]);
    expect(isTelnyxConfigured()).toBe(true);
  });

  it('trata el valor en blanco como faltante (espacios accidentales en Render)', () => {
    process.env.TELNYX_API_KEY = '   ';
    process.env.TELNYX_APP_ID = 'app_123';
    process.env.TELNYX_DEFAULT_PHONE_NUMBER = '+573001112233';
    expect(missingTelnyxEnv()).toEqual(['TELNYX_API_KEY']);
    expect(isTelnyxConfigured()).toBe(false);
  });

  it('devuelve solo nombres, nunca valores (seguro para exponer en un 503)', () => {
    process.env.TELNYX_API_KEY = 'KEY_super_secreta_123';
    const missing = missingTelnyxEnv();
    expect(missing.join(' ')).not.toContain('KEY_super_secreta_123');
    for (const name of missing) {
      expect(TELNYX_REQUIRED_ENV.some((env) => env === name)).toBe(true);
    }
  });

  it('el mensaje de error de las rutas nombra exactamente la env que falta', () => {
    process.env.TELNYX_API_KEY = 'KEY_test';
    const message = `Telnyx no está configurado: falta ${missingTelnyxEnv().join(', ')}`;
    expect(message).toBe(
      'Telnyx no está configurado: falta TELNYX_APP_ID, TELNYX_DEFAULT_PHONE_NUMBER'
    );
    expect(message).not.toContain('TELNYX_API_KEY');
  });
});
