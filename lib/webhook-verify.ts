import crypto from 'crypto';

/**
 * Verificación de firmas HMAC para webhooks entrantes.
 * Principio: si el secreto no está configurado en el entorno, el endpoint
 * rechaza el request en producción (fail-closed) y solo advierte en dev.
 */

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Valida el header X-Hub-Signature-256 de Meta:
 *   "sha256=<hmac-sha256(rawBody, appSecret) en hex>"
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!appSecret || !signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return timingSafeEqualHex(signatureHeader.slice('sha256='.length), expected);
}

/**
 * Valida el header X-Vapi-Signature de Vapi:
 *   HMAC-SHA256(rawBody, serverSecret) en hex.
 */
export function verifyVapiSignature(rawBody: string, signatureHeader: string | null, serverSecret: string): boolean {
  if (!serverSecret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', serverSecret).update(rawBody, 'utf8').digest('hex');
  return timingSafeEqualHex(signatureHeader, expected);
}

/**
 * Valida el header X-Bold-Signature de Bold.
 *
 * Bold firma los webhooks con la **llave secreta** de la cuenta. El esquema
 * documentado es un hash SHA256 en hex de `body + secret` (concatenación simple,
 * NO HMAC), pero distintas versiones del integrador usan HMAC-SHA256(body, secret).
 * Aceptamos ambos, comparados en tiempo constante, y toleramos el prefijo
 * `sha256=` por si la cuenta lo incluye.
 *
 * Ver `getBoldSignatureSecret()` en `lib/billing/bold.ts` para el nombre de la
 * variable de entorno.
 */
export function verifyBoldSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!secret || !signatureHeader) return false;
  const received = signatureHeader.trim().toLowerCase().replace(/^sha256=/, '');
  if (!received) return false;

  const hashed = crypto.createHash('sha256').update(`${rawBody}X${secret}`, 'utf8').digest('hex');
  if (timingSafeEqualHex(received, hashed)) return true;

  // Variante sin separador (algunas cuentas concatenan directo).
  const hashedPlain = crypto.createHash('sha256').update(`${rawBody}${secret}`, 'utf8').digest('hex');
  if (timingSafeEqualHex(received, hashedPlain)) return true;

  const hmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return timingSafeEqualHex(received, hmac);
}

/**
 * Valida un secreto compartido simple por header (Neon / n8n):
 *   X-Webhook-Secret: <NEON_WEBHOOK_SECRET>
 * Comparación en tiempo constante para evitar oráculos de timing.
 */
export function verifySharedSecret(receivedSecret: string | null, expectedSecret: string): boolean {
  if (!receivedSecret || !expectedSecret) return false;
  return timingSafeEqualHex(receivedSecret, expectedSecret);
}
