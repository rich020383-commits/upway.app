/**
 * Flujo de activación Upway: ONBOARDING → APROBACIÓN → PAGO BOLD → ENTREGA.
 *
 * Etapas cubiertas aquí:
 * 1. Recibida la solicitud (onboarding) → correo de confirmación al cliente.
 * 2. Aprobado el caso de uso (approvals) → link de pago Bold + correo con botón.
 * 3. Webhook de Bold aprueba el pago → correo de "implementación iniciada".
 * 4. Entrega del servicio activo (activate) → correo con datos de acceso.
 *
 * La conciliación se hace por `reference` (merchant_reference enviada a Bold),
 * persistida en ActivationPayment para idempotencia y trazabilidad (auditoría
 * A11: dejar de depender de variables en memoria).
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createBoldPaymentLink, computeBoldLinkExpiry } from '@/lib/billing/bold';
import { getHealthPlan, planCommercialSummary } from '@/lib/health/plans-enterprise';
import { withIVA } from '@/lib/health/plans';
import { resolveContractTariff } from '@/lib/pricing/rules';
import {
  activationReceivedEmail,
  activationApprovedEmail,
  paymentConfirmedEmail,
  serviceActiveEmail,
  internalActivationAlertEmail,
  type ActivationReceivedData,
  type ActivationApprovedData,
  type PaymentConfirmedData,
  type ServiceActiveData,
} from '@/lib/email-activation';

export const UPWAY_INTERNAL_REVIEW_EMAIL =
  process.env.UPWAY_REVIEW_EMAIL ?? 'activacionplan@upway.business';

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://upway.business';
  return raw.replace(/\/+$/, '');
}

const activationPaymentRepo = (prisma as any).activationPayment;

/**
 * Inicio del contrato vigente del cliente: el primer pago APROBADO de su organizacion
 * o sede. Es la fuente de verdad del grandfathering: si el cliente firma antes de la
 * tarifa final, se le sigue cobrando su tarifa hasta la renovacion.
 *
 * Defensivo a proposito: si el repositorio no expone findFirst (mocks) o la consulta
 * falla, se asume cliente nuevo (tarifa final) y queda registrado en el log.
 */
async function resolveContractStart(input: {
  organizationId?: string | null;
  clinicId?: string | null;
}): Promise<Date | null> {
  const repo = activationPaymentRepo as {
    findFirst?: (args: unknown) => Promise<{ createdAt?: Date | string } | null>;
  };
  if (typeof repo?.findFirst !== 'function') return null;

  const scopes: Array<Record<string, string>> = [];
  if (input.organizationId) scopes.push({ organizationId: input.organizationId });
  if (input.clinicId) scopes.push({ clinicId: input.clinicId });
  // Los alcances se arman por push: sin cast y con tipos reales.
  if (scopes.length === 0) return null;

  try {
    const first = await repo.findFirst({
      where: { OR: scopes, status: 'PAID' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    if (!first?.createdAt) return null;
    const startedAt = new Date(first.createdAt);
    return Number.isNaN(startedAt.getTime()) ? null : startedAt;
  } catch (error) {
    console.warn('[activation] No se pudo resolver el inicio de contrato:', error);
    return null;
  }
}

/** Referencia comercial única (merchant_reference) que Bold devuelve en sus webhooks. */
export function buildActivationReference(planId: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `UPW-${planId.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${stamp}${rand}`;
}

export type CreatePaymentLinkInput = {
  planId: string;
  customerEmail: string;
  customerName?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  clinicId?: string | null;
  sessionId?: string | null;
};

export type CreatePaymentLinkResult =
  | {
      ok: true;
      reference: string;
      paymentUrl: string;
      planName: string;
      amountCOP: number;
      pricing: ReturnType<typeof planCommercialSummary>;
    }
  | { ok: false; status: number; error: string };

/**
 * Persiste el intento de pago y crea el link de pago en Bold.
 * El precio SIEMPRE se calcula en el servidor desde el catálogo de planes;
 * el monto enviado por el cliente nunca se usa.
 */
export async function createActivationPaymentLink(
  input: CreatePaymentLinkInput
): Promise<CreatePaymentLinkResult> {
  const plan = getHealthPlan(input.planId);
  if (!plan) {
    return { ok: false, status: 400, error: 'Plan no encontrado en el catálogo Upway.' };
  }

  // Solo planes Health con precio fijo y auto-activables (consultorio/clinica/IPS).
  // eps-custom y demas "Custom" se cotizan por deal desk: no tienen link de pago.
  if (!plan.autoActivatable || plan.monthlyCOP <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Este plan se cotiza con el equipo comercial (deal desk) y no admite pago por link.',
    };
  }

  // Politica de clientes actuales: si el cliente ya tenia contrato antes de la tarifa
  // final, se le cobra SU tarifa (no el catalogo nuevo) hasta que renueve.
  const contractStart = await resolveContractStart(input);
  const tariff = resolveContractTariff({
    vertical: 'health',
    planId: plan.id,
    contractStartedAt: contractStart,
    final: { monthlyCOP: plan.monthlyCOP, setupCOP: plan.setupCOP, overageCOP: plan.overageCOP },
  });
  const billedPlan = {
    ...plan,
    monthlyCOP: tariff.monthlyCOP,
    setupCOP: tariff.setupCOP,
    overageCOP: tariff.overageCOP,
  };
  const pricing = planCommercialSummary(billedPlan);
  // Base mensual + setup, ambos con IVA 19% (traslado a DIAN).
  const amountCOP = pricing.conIvaCOP + withIVA(billedPlan.setupCOP);
  const reference = buildActivationReference(plan.id);
  // Vigencia del link (default 7 dias, ajustable con BOLD_LINK_TTL_DAYS).
  const expiresAt = computeBoldLinkExpiry();

  const payment = await activationPaymentRepo.create({
    data: {
      reference,
      planId: plan.id,
      planName: plan.name,
      amountCOP,
      currency: 'COP',
      status: 'PENDING',
      customerEmail: input.customerEmail.toLowerCase(),
      customerName: input.customerName ?? null,
      userId: input.userId ?? null,
      organizationId: input.organizationId ?? null,
      clinicId: input.clinicId ?? null,
      sessionId: input.sessionId ?? null,
      expiresAt,
      statusMessage:
        'Link de pago solicitado a Bold (' +
        (tariff.applied === 'legacy' ? 'tarifa vigente del cliente' : 'tarifa final') +
        ')',
    },
  });

  const bold = await createBoldPaymentLink({
    reference,
    description: `Upway ${plan.name} — activación de caso de uso`,
    amountCOP,
    customerEmail: input.customerEmail,
    callbackUrl: `${getAppBaseUrl()}/api/webhooks/bold`,
    afterUrl: `${getAppBaseUrl()}/activation/pago-confirmado?ref=${encodeURIComponent(reference)}`,
    tags: ['upway', 'activacion', plan.id],
    expiresAt,
  });

  if (!bold.ok) {
    await activationPaymentRepo
      .update({
        where: { reference: payment.reference },
        data: { statusMessage: `Error Bold: ${bold.error}` },
      })
      .catch(() => null);
    return { ok: false, status: bold.status, error: bold.error };
  }

  await activationPaymentRepo.update({
    where: { reference: payment.reference },
    data: { paymentUrl: bold.url },
  });

  return {
    ok: true,
    reference: payment.reference,
    paymentUrl: bold.url,
    planName: plan.name,
    amountCOP,
    pricing,
  };
}

export type ProcessBoldEventInput = {
  reference: string;
  eventType: string;
  boldPaymentId?: string | null;
  statusMessage?: string | null;
};

export type ProcessBoldEventResult =
  | { ok: true; applied: boolean; paymentId: string }
  | { ok: false; error: string };

/**
 * Aplica el evento del webhook de Bold de forma IDEMPOTENTE:
 * - Si el evento ya se concilió (status PAID), responde ok sin renotificar.
 * - Eventos no-aprobados solo actualizan trazabilidad (statusMessage).
 * Devuelve applied=true SOLO la primera vez que el pago pasa a PAID, para que
 * el webhook dispare el correo al cliente una única vez.
 */
export async function processBoldEvent(input: ProcessBoldEventInput): Promise<ProcessBoldEventResult> {
  const payment = await activationPaymentRepo.findUnique({
    where: { reference: input.reference },
  });

  if (!payment) {
    return { ok: false, error: 'Referencia de pago desconocida' };
  }

  const event = input.eventType.toUpperCase();
  const isApproved = event.includes('APPROVED') || event.includes('PAID') || event.includes('SALE');

  if (!isApproved) {
    await activationPaymentRepo
      .update({
        where: { reference: payment.reference },
        data: {
          statusMessage: `${input.eventType}${input.statusMessage ? `: ${input.statusMessage}` : ''}`,
          ...(event.includes('EXPIRED') && payment.status === 'PENDING' ? { status: 'EXPIRED' as const } : {}),
          ...(event.includes('CANCEL') && payment.status === 'PENDING' ? { status: 'CANCELLED' as const } : {}),
          ...(event.includes('DECLIN') && payment.status === 'PENDING' ? { status: 'FAILED' as const } : {}),
        },
      })
      .catch(() => null);
    return { ok: true, applied: false, paymentId: payment.id };
  }

  if (payment.status === 'PAID') {
    return { ok: true, applied: false, paymentId: payment.id };
  }

  const updated = await activationPaymentRepo.update({
    where: { reference: payment.reference },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      boldPaymentId: input.boldPaymentId ?? payment.boldPaymentId,
      statusMessage: `Pago aprobado (${input.eventType})`,
    },
  });

  return { ok: true, applied: true, paymentId: updated.id };
}

/** Datos consolidados para la pantalla de estado de pago (GET /api/checkout?ref=...). */
export async function getActivationStatus(reference: string) {
  const payment = await activationPaymentRepo.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      planId: true,
      planName: true,
      amountCOP: true,
      currency: true,
      paymentUrl: true,
      statusMessage: true,
      paidAt: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!payment) return null;

  // `expired` se calcula en cada lectura (no requiere cron): un intento PENDING
  // cuya vigencia ya paso se reporta vencido sin alterar el status almacenado,
  // que sigue siendo la fuente de verdad de la conciliacion con Bold.
  const expiresAtTime = payment.expiresAt ? new Date(payment.expiresAt).getTime() : null;
  const expired =
    payment.status === 'PENDING' &&
    expiresAtTime !== null &&
    Number.isFinite(expiresAtTime) &&
    expiresAtTime < Date.now();

  return { ...payment, expired };
}

// ---------------------------------------------------------------------------
// Correos del flujo (el envío nunca lanza: los errores se loguean)
// ---------------------------------------------------------------------------

export async function sendActivationReceivedEmail(to: string, data: ActivationReceivedData) {
  const { subject, html } = activationReceivedEmail(data);
  return sendEmail({ to, subject, html });
}

export async function sendActivationApprovedEmail(to: string, data: ActivationApprovedData) {
  const { subject, html } = activationApprovedEmail(data);
  return sendEmail({ to, subject, html });
}

export async function sendPaymentConfirmedEmail(to: string, data: PaymentConfirmedData) {
  const { subject, html } = paymentConfirmedEmail(data);
  return sendEmail({ to, subject, html });
}

export async function sendServiceActiveEmail(to: string, data: ServiceActiveData) {
  const { subject, html } = serviceActiveEmail(data);
  return sendEmail({ to, subject, html });
}

export async function sendInternalActivationAlert(to: string, kind: 'SOLICITUD_RECIBIDA' | 'CASO_APROBADO' | 'PAGO_CONFIRMADO' | 'SERVICIO_ACTIVADO', title: string, lines: Array<[string, string]>) {
  const { subject, html } = internalActivationAlertEmail({ kind, title, lines });
  return sendEmail({ to, subject, html });
}

export function formatCopLabel(amountCOP: number): string {
  return `$${Math.round(amountCOP).toLocaleString('es-CO')} COP`;
}