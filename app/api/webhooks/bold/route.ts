import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyBoldSignature } from '@/lib/webhook-verify';
import {
  getBoldSignatureSecret,
  getBoldSignatureSecretSource,
  BOLD_SIGNATURE_ENV_NAME_LIST,
} from '@/lib/billing/bold';
import { recordProviderEvent } from '@/lib/event-audit';
import {
  processBoldEvent,
  sendPaymentConfirmedEmail,
  sendInternalActivationAlert,
  UPWAY_INTERNAL_REVIEW_EMAIL,
  formatCopLabel,
} from '@/lib/activation';

export const runtime = 'nodejs';

/**
 * Webhook de Bold (pagos del flujo de activación).
 * - Valida el header X-Bold-Signature con la **llave secreta** de la cuenta
 *   (`BOLD_SECRET_KEY`, también aceptada como `BOLD_INTEGRITY_SIGNATURE` /
 *   `BOLD_WEBHOOK_SECRET` — ver `getBoldSignatureSecret()` en `lib/billing/bold.ts`).
 * - Concilia por merchant_reference (nuestra `reference` de ActivationPayment).
 * - Es idempotente: los reintentos de Bold no duplican correos ni cambios.
 * - Responde 200 apenas valida y registra; los correos van en after().
 */

type BoldWebhookPayload = {
  event?: string;
  type?: string;
  status?: string;
  reference?: string;
  merchant_reference?: string;
  payment_id?: string;
  id?: string;
  amount?: unknown;
  payment?: {
    id?: string;
    status?: string;
    reference?: string;
    merchant_reference?: string;
  };
  data?: {
    reference?: string;
    merchant_reference?: string;
    id?: string;
    payment?: { id?: string };
  };
};

function extractReference(payload: BoldWebhookPayload): string | null {
  return (
    payload.reference ??
    payload.merchant_reference ??
    payload.payment?.merchant_reference ??
    payload.payment?.reference ??
    payload.data?.merchant_reference ??
    payload.data?.reference ??
    null
  );
}

function extractPaymentId(payload: BoldWebhookPayload): string | null {
  return (
    payload.payment?.id ??
    payload.payment_id ??
    payload.data?.payment?.id ??
    payload.data?.id ??
    payload.id ??
    null
  );
}

function extractEventType(payload: BoldWebhookPayload): string {
  return (
    payload.event ??
    payload.type ??
    payload.payment?.status ??
    payload.status ??
    'unknown_event'
  );
}

function extractAmount(payload: BoldWebhookPayload): number | null {
  const raw = payload.amount ?? (payload.payment as { amount?: unknown } | undefined)?.amount;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const total = obj.total_amount ?? obj.totalAmount ?? obj.amount;
    if (typeof total === 'number' && Number.isFinite(total)) return total;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-bold-signature');
  const secret = getBoldSignatureSecret();

  if (!secret) {
    console.error(
      '[webhook:bold] No hay llave de firma configurada (BOLD_SECRET_KEY / BOLD_INTEGRITY_SIGNATURE / BOLD_WEBHOOK_SECRET). Evento rechazado.'
    );
    return NextResponse.json(
      {
        error: 'Webhook not configured',
        hint: 'Configura en el entorno la "Llave secreta" de Bold (Integraciones → API pagos en línea) como BOLD_SECRET_KEY.',
        diagnostics: 'GET /api/webhooks/bold',
      },
      { status: 503 }
    );
  }

  if (!verifyBoldSignature(rawBody, signature, secret)) {
    console.warn('[webhook:bold] Firma inválida o ausente (X-Bold-Signature). Evento descartado.');
    await recordProviderEvent({
      provider: 'bold',
      eventType: 'signature_rejected',
      status: 'rejected',
      entityType: 'activation_payment',
      payload: { receivedLength: rawBody.length, amount: null },
    }).catch(() => null);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: BoldWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BoldWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const reference = extractReference(payload);
  const eventType = extractEventType(payload);
  const boldPaymentId = extractPaymentId(payload);
  const amountCents = extractAmount(payload);

  if (!reference) {
    await recordProviderEvent({
      provider: 'bold',
      eventType,
      status: 'rejected',
      entityType: 'activation_payment',
      payload,
      metadata: { reason: 'missing_merchant_reference' },
    }).catch(() => null);
    // 200: reintentar no resolverá la falta de referencia; se registra y se ignora.
    return NextResponse.json({ received: true, matched: false, reason: 'missing_reference' });
  }

  const result = await processBoldEvent({
    reference,
    eventType,
    boldPaymentId,
    statusMessage: typeof payload.status === 'string' ? payload.status : null,
  });

  if (!result.ok) {
    await recordProviderEvent({
      provider: 'bold',
      eventType,
      status: 'rejected',
      entityType: 'activation_payment',
      entityId: boldPaymentId,
      payload,
      metadata: { reason: result.error },
    }).catch(() => null);
    return NextResponse.json({ received: true, matched: false, reason: result.error });
  }

  await recordProviderEvent({
    provider: 'bold',
    eventType,
    status: 'processed',
    entityType: 'activation_payment',
    entityId: result.paymentId,
    payload,
    metadata: { applied: result.applied, amountCents },
  }).catch(() => null);

  if (result.applied) {
    const payment = await (prisma as any).activationPayment.findUnique({
      where: { reference },
      select: {
        customerEmail: true,
        customerName: true,
        planName: true,
        amountCOP: true,
        reference: true,
      },
    });

    if (payment?.customerEmail) {
      after(async () => {
        const clientMail = await sendPaymentConfirmedEmail(payment.customerEmail as string, {
          contactName: payment.customerName ?? '',
          planName: payment.planName,
          amountLabel: formatCopLabel(payment.amountCOP),
          reference: payment.reference,
        });

        await sendInternalActivationAlert(
          UPWAY_INTERNAL_REVIEW_EMAIL,
          'PAGO_CONFIRMADO',
          `Pago aprobado: ${payment.planName} (${payment.reference})`,
          [
            ['Referencia', payment.reference],
            ['Plan', payment.planName],
            ['Valor', formatCopLabel(payment.amountCOP)],
            ['Cliente', payment.customerEmail ?? '—'],
            ['Correo al cliente', clientMail.ok ? 'enviado' : `falló: ${clientMail.error ?? 'N/A'}`],
            ['Siguiente paso', 'Iniciar implementación y agendar entrega del servicio activo'],
          ]
        );
      });
    }
  }

  return NextResponse.json({ received: true, matched: true, applied: result.applied });
}

/**
 * Diagnóstico del webhook (sin secretos).
 * Permite responder en 2 segundos "¿por qué Bold no concilia?":
 *   GET https://upway.business/api/webhooks/bold
 * Devuelve SOLO el nombre de la variable en uso y los alias aceptados,
 * nunca el valor de la llave.
 */
export async function GET() {
  const source = getBoldSignatureSecretSource();
  const hasBoldApiKey = Boolean(process.env.BOLD_API_KEY);

  return NextResponse.json({
    ok: true,
    webhook: {
      path: '/api/webhooks/bold',
      method: 'POST',
      signatureHeader: 'X-Bold-Signature',
      scheme: 'SHA256(rawBody + llave secreta), también acepta HMAC-SHA256',
    },
    config: {
      boldApiKeyPresent: hasBoldApiKey,
      signatureSecretPresent: source !== null,
      signatureSecretEnvNameInUse: source,
      acceptedEnvNames: BOLD_SIGNATURE_ENV_NAME_LIST,
    },
    nextSteps: source
      ? [
          'La llave de firma ya está configurada: registra esta URL como webhook en el panel de Bold.',
          'Haz una compra de prueba y revisa que aquí responda { received: true, matched: true }.',
        ]
      : [
          'Falta la llave de firma. En el panel de Bold: Integraciones -> Llaves de integracion -> pestana "API pagos en linea" -> "Mostrar llaves" -> copia la LLAVE SECRETA (no la de identidad).',
          'Créala en el entorno (Render) como BOLD_SECRET_KEY y redeploya.',
          'La "llave de identidad" NO sirve como firma: esa es BOLD_API_KEY, que solo crea los links de pago.',
        ],
  });
}