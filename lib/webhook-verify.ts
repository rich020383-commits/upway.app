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
 * Valida un secreto compartido simple por header (Neon / n8n):
 *   X-Webhook-Secret: <NEON_WEBHOOK_SECRET>
 * Comparación en tiempo constante para evitar oráculos de timing.
 */
export function verifySharedSecret(receivedSecret: string | null, expectedSecret: string): boolean {
  if (!receivedSecret || !expectedSecret) return false;
  return timingSafeEqualHex(receivedSecret, expectedSecret);
}
