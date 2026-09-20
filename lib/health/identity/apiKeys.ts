/**
 * Llaves de API para integracion maquina-a-maquina (Upway Health).
 *
 * Es lo que hace real el "adaptalo a tu sistema": el HIS/HCE del cliente
 * consulta el registro conforme con una llave propia, sin depender de que un
 * humano copie datos.
 *
 * Reglas:
 * - La llave se guarda **hasheada** (sha256). En claro solo se muestra UNA vez
 *   al crearla: si se pierde, se revoca y se emite otra.
 * - La comparacion es de tiempo constante (timingSafeEqual): no se filtra por
 *   tiempo de respuesta cuantos caracteres coincidian.
 * - El prefijo publico identifica la llave en logs y soporte sin exponerla.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const API_KEY_PREFIX = 'upw_live_';

/** 24 bytes = 192 bits de entropia -> 48 caracteres hex. */
const KEY_BYTES = 24;
/** Longitud minima del secreto para considerar el formato valido (32 hex). */
const MIN_SECRET_LENGTH = 32;

export type GeneratedApiKey = {
  /** Se muestra UNA sola vez. No se puede recuperar despues. */
  key: string;
  /** sha256 de la llave: es lo unico que se almacena. */
  keyHash: string;
  /** Identifica la llave en logs sin exponerla. */
  keyPrefix: string;
  lastFour: string;
};

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw.trim(), 'utf8').digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(KEY_BYTES).toString('hex');
  const key = `${API_KEY_PREFIX}${secret}`;
  return {
    key,
    keyHash: hashApiKey(key),
    keyPrefix: `${API_KEY_PREFIX}${secret.slice(0, 8)}`,
    lastFour: secret.slice(-4),
  };
}

/** Formato: descarta basura antes de consultar la base de datos. */
export function looksLikeApiKey(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const candidate = raw.trim();
  if (!candidate.startsWith(API_KEY_PREFIX)) return false;
  const secret = candidate.slice(API_KEY_PREFIX.length);
  return secret.length >= MIN_SECRET_LENGTH && /^[a-zA-Z0-9]+$/.test(secret);
}

/** Comparacion de tiempo constante contra el hash almacenado. */
export function verifyApiKey(raw: string | null | undefined, expectedHash: string): boolean {
  if (!raw || !expectedHash) return false;
  const candidate = Buffer.from(hashApiKey(raw), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (candidate.length !== expected.length || expected.length === 0) return false;
  return timingSafeEqual(candidate, expected);
}

/** Extrae la llave de `Authorization: Bearer <key>`. */
export function bearerFromHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}
