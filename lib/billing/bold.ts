/**
 * Cliente mínimo para la API de Bold (Colombia) — link de pagos.
 *
 * Documentación: https://developers.bold.co (API Link de pagos / Webhook API).
 *
 * ⚠️ Contratos que conviene re-verificar contra el panel de Bold al activar:
 * - Endpoint: POST https://integrations.api.bold.co/online/link/v1
 *   Header de autenticación: "Authorization: x-api-key <BOLD_API_KEY>".
 * - `amount_type`: "CLOSED" exige `amount.currency` + `amount.total_amount`.
 * - `merchant_reference`: referencia comercial propia (única por intención de
 *   pago) que Bold devuelve en los webhooks para conciliar.
 * - ⚠️ Unidades del monto: el checkout existente ya envía pesos completos (no
 *   centavos) y es el criterio adoptado aquí. Si al probar contra el sandbox
 *   de Bold los montos salen 100x, cambiar SOLO `toBoldAmount` para que
 *   multiplique por 100 (Bold suele expresar montos en centavos).
 * - Respuesta esperada: `{ payload: { url: "https://pay.bold.co/..." } }`.
 */

const BOLD_LINK_ENDPOINT = 'https://integrations.api.bold.co/online/link/v1';

export type CreateBoldLinkInput = {
  reference: string;
  description: string;
  amountCOP: number;
  customerEmail?: string | null;
  callbackUrl?: string | null;
  afterUrl?: string | null;
  tags?: string[];
};

export type CreateBoldLinkResult =
  | { ok: true; url: string; raw: unknown }
  | { ok: false; status: number; error: string };

export function isBoldConfigured(): boolean {
  return Boolean(process.env.BOLD_API_KEY);
}

/**
 * Resuelve la llave que firma los webhooks de Bold (header X-Bold-Signature).
 *
 * En el panel de Bold solo existen DOS llaves (Integraciones → Llaves de integración,
 * pestaña "API pagos en línea"):  "Llave de identidad" (crea los links) y
 * "Llave secreta" (firma los webhooks). No hay una llave llamada "firma de integridad":
 * ese rótulo aparecía en documentación antigua / cuentas heredadas.
 * Por eso BOLD_SECRET_KEY es el nombre canónico y el resto son alias tolerados.
 */
const BOLD_SIGNATURE_ENV_NAMES = [
  'BOLD_SECRET_KEY',
  'BOLD_INTEGRITY_SIGNATURE',
  'BOLD_WEBHOOK_SECRET',
  'BOLD_API_SECRET',
  'BOLD_SIGNING_SECRET',
] as const;

export type BoldSignatureEnvName = (typeof BOLD_SIGNATURE_ENV_NAMES)[number] | null;

/**
 * Nombre de la variable de entorno que contiene la llave de firma (NO el valor).
 * Sirve para diagnóstico en producción: permite confirmar qué variable está
 * tomando el webhook sin exponer ningún secreto.
 */
export function getBoldSignatureSecretSource(): BoldSignatureEnvName {
  for (const name of BOLD_SIGNATURE_ENV_NAMES) {
    const value = process.env[name];
    if (value && value.trim()) return name;
  }
  return null;
}

export function getBoldSignatureSecret(): string | null {
  const source = getBoldSignatureSecretSource();
  return source ? (process.env[source] ?? '').trim() || null : null;
}

export function isBoldSignatureConfigured(): boolean {
  return getBoldSignatureSecret() !== null;
}

export const BOLD_SIGNATURE_ENV_NAME_LIST: readonly string[] = BOLD_SIGNATURE_ENV_NAMES;

/** Punto único de conversión de COP al formato que espera la API de Bold. */
export function toBoldAmount(amountCOP: number): number {
  return Math.round(Number(amountCOP) || 0);
}

export async function createBoldPaymentLink(input: CreateBoldLinkInput): Promise<CreateBoldLinkResult> {
  const apiKey = process.env.BOLD_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 503, error: 'BOLD_API_KEY no está configurada en el entorno.' };
  }

  const body: Record<string, unknown> = {
    amount_type: 'CLOSED',
    amount: { currency: 'COP', total_amount: toBoldAmount(input.amountCOP) },
    description: input.description.slice(0, 220),
    merchant_reference: input.reference,
  };

  if (input.callbackUrl) body.callback_url = input.callbackUrl;
  if (input.afterUrl) body.after_url = input.afterUrl;
  if (input.customerEmail) body.customer_email = input.customerEmail;
  if (input.tags?.length) body.tags = input.tags;

  try {
    const response = await fetch(BOLD_LINK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `x-api-key ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const raw: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        raw && typeof raw === 'object' && 'message' in raw && typeof (raw as Record<string, unknown>).message === 'string'
          ? ((raw as Record<string, unknown>).message as string)
          : `Bold respondió ${response.status}`;
      return { ok: false, status: response.status, error: message };
    }

    const payload =
      raw && typeof raw === 'object' && 'payload' in raw && raw.payload && typeof raw.payload === 'object'
        ? (raw.payload as Record<string, unknown>)
        : null;

    const url = typeof payload?.url === 'string' ? payload.url : null;
    if (!url || !url.startsWith('http')) {
      return { ok: false, status: 502, error: 'Bold no devolvió payload.url en la respuesta.' };
    }

    return { ok: true, url, raw };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Error inesperado llamando a la API de Bold.',
    };
  }
}