import { describe, it, expect } from 'vitest';


/**
 * Tests de llaves de API — la llave es la puerta al dato clinico del cliente.
 * Si esto falla, la integracion maquina-a-maquina no es confiable.
 */

import {
  API_KEY_PREFIX,
  bearerFromHeader,
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
  verifyApiKey,
} from './apiKeys';

describe('generateApiKey', () => {
  it('genera una llave con prefijo reconocible y no repite', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(a.key).not.toBe(b.key);
    expect(a.keyHash).not.toBe(b.keyHash);
  });

  it('el hash almacenado corresponde a la llave y no la contiene', () => {
    const { key, keyHash } = generateApiKey();
    expect(keyHash).toBe(hashApiKey(key));
    expect(keyHash).not.toContain(key);
    expect(key).not.toContain(keyHash);
  });

  it('expone prefijo y ultimos cuatro para soporte, sin revelar el secreto', () => {
    const { key, keyPrefix, lastFour } = generateApiKey();
    expect(key.startsWith(keyPrefix)).toBe(true);
    expect(key.endsWith(lastFour)).toBe(true);
    // El prefijo no alcanza para reconstruir la llave.
    expect(keyPrefix.length).toBeLessThan(key.length);
  });
});

describe('looksLikeApiKey', () => {
  it('acepta el formato emitido por Upway', () => {
    expect(looksLikeApiKey(generateApiKey().key)).toBe(true);
  });

  it('rechaza vacios, basura y prefijos ajenos', () => {
    expect(looksLikeApiKey(null)).toBe(false);
    expect(looksLikeApiKey(undefined)).toBe(false);
    expect(looksLikeApiKey('')).toBe(false);
    expect(looksLikeApiKey('Bearer upw_live_x')).toBe(false);
    expect(looksLikeApiKey('upw_live_corto')).toBe(false);
    expect(looksLikeApiKey('sk_live_' + 'a'.repeat(40))).toBe(false);
  });
});

describe('verifyApiKey', () => {
  it('valida la llave correcta contra su hash', () => {
    const { key, keyHash } = generateApiKey();
    expect(verifyApiKey(key, keyHash)).toBe(true);
  });

  it('rechaza una llave distinta aunque tenga el mismo prefijo', () => {
    const { keyHash } = generateApiKey();
    const otra = generateApiKey();
    expect(verifyApiKey(otra.key, keyHash)).toBe(false);
  });

  it('rechaza vacios y hashes invalidos sin lanzar', () => {
    const { key } = generateApiKey();
    expect(verifyApiKey(key, '')).toBe(false);
    expect(verifyApiKey(null, 'abc')).toBe(false);
    expect(verifyApiKey(key, 'no-es-un-hash-hex')).toBe(false);
  });
});

describe('bearerFromHeader', () => {
  it('extrae la llave del header Authorization', () => {
    expect(bearerFromHeader('Bearer upw_live_abc')).toBe('upw_live_abc');
    expect(bearerFromHeader('bearer   upw_live_abc  ')).toBe('upw_live_abc');
  });

  it('devuelve null si no hay Bearer utilizable', () => {
    expect(bearerFromHeader(null)).toBeNull();
    expect(bearerFromHeader('')).toBeNull();
    expect(bearerFromHeader('Basic abc')).toBeNull();
    expect(bearerFromHeader('Bearer')).toBeNull();
  });
});
