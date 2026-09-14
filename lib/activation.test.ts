import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activationPayment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true, messageId: 'test-id' }),
}));

vi.mock('@/lib/billing/bold', () => ({
  isBoldConfigured: vi.fn().mockReturnValue(true),
  toBoldAmount: (cop: number) => cop,
  createBoldPaymentLink: vi.fn().mockResolvedValue({
    ok: true,
    url: 'https://pay.bold.co/test-link',
  }),
}));

import { prisma } from '@/lib/prisma';
import { createBoldPaymentLink } from '@/lib/billing/bold';
import {
  buildActivationReference,
  createActivationPaymentLink,
  getActivationStatus,
  processBoldEvent,
} from '@/lib/activation';
import { getHealthPlan, planCommercialSummary } from '@/lib/health/plans-enterprise';
import { withIVA } from '@/lib/health/plans';

const mockedCreate = (prisma as any).activationPayment.create as unknown as Mock;
const mockedFindUnique = (prisma as any).activationPayment.findUnique as unknown as Mock;
const mockedUpdate = (prisma as any).activationPayment.update as unknown as Mock;
const mockedBold = createBoldPaymentLink as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockedBold.mockResolvedValue({ ok: true, url: 'https://pay.bold.co/test-link' });
  mockedCreate.mockImplementation(async ({ data }) => ({
    id: 'ap-1',
    ...data,
  }));
  mockedUpdate.mockImplementation(async ({ data }) => ({ id: 'ap-1', ...data }));
});

describe('buildActivationReference', () => {
  it('genera referencias únicas con prefijo UPW y el plan sanitizado', () => {
    const a = buildActivationReference('consultorio-600');
    const b = buildActivationReference('consultorio-600');
    expect(a).not.toBe(b);
    expect(a.startsWith('UPW-CONSULTORIO600-')).toBe(true);
  });
});

describe('createActivationPaymentLink', () => {
  it('crea el intento de pago con IVA incluido y url de Bold (solo planes Health)', async () => {
    const result = await createActivationPaymentLink({
      planId: 'consultorio-600',
      customerEmail: 'ips@test.co',
      customerName: 'Dra. Prueba',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.paymentUrl).toBe('https://pay.bold.co/test-link');
    expect(result.reference).toBeTruthy();

    const plan = getHealthPlan('consultorio-600');
    expect(plan).not.toBeNull();
    if (!plan) return;
    const expected = planCommercialSummary(plan).conIvaCOP + withIVA(plan.setupCOP);
    expect(result.amountCOP).toBe(expected);

    // merchant_reference viaja a Bold para conciliar el webhook
    expect(mockedBold).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: result.reference,
        amountCOP: expected,
        callbackUrl: expect.stringContaining('/api/webhooks/bold'),
      }),
    );
  });

  it('rechaza planes suspendidos de WhatsApp que no están en el catálogo Health', async () => {
    for (const planId of ['emprendedor', 'negocio', 'pro']) {
      const result = await createActivationPaymentLink({
        planId,
        customerEmail: 'x@test.co',
      });
      expect(result.ok).toBe(false);
      expect(mockedCreate).not.toHaveBeenCalled();
      expect(mockedBold).not.toHaveBeenCalled();
    }
  });

  it('rechaza planes Custom (eps-custom) porque se cotizan por deal desk', async () => {
    const result = await createActivationPaymentLink({
      planId: 'eps-custom',
      customerEmail: 'eps@test.co',
    });
    expect(result.ok).toBe(false);
    expect(mockedBold).not.toHaveBeenCalled();
  });

  it('marca el intento como fallido si Bold rechaza la creación', async () => {
    mockedBold.mockResolvedValueOnce({ ok: false, status: 503, error: 'Bold caído' });
    const result = await createActivationPaymentLink({
      planId: 'consultorio-600',
      customerEmail: 'x@test.co',
    });
    expect(result.ok).toBe(false);
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statusMessage: expect.stringContaining('Error Bold') }),
      }),
    );
  });
});

describe('processBoldEvent (idempotencia)', () => {
  const PENDING = {
    id: 'ap-1',
    reference: 'UPW-REF',
    status: 'PENDING',
    boldPaymentId: null,
  };

  it('aplica el pago aprobado una sola vez', async () => {
    mockedFindUnique.mockResolvedValueOnce({ ...PENDING });
    const first = await processBoldEvent({
      reference: 'UPW-REF',
      eventType: 'payment_link.paid',
      boldPaymentId: 'bold-9',
    });
    expect(first).toEqual({ ok: true, applied: true, paymentId: 'ap-1' });
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', paidAt: expect.anything() }),
      }),
    );
  });

  it('ignora reintentos cuando el pago ya está PAID', async () => {
    mockedFindUnique.mockResolvedValueOnce({ ...PENDING, status: 'PAID' });
    const retry = await processBoldEvent({ reference: 'UPW-REF', eventType: 'payment_link.paid' });
    expect(retry).toEqual({ ok: true, applied: false, paymentId: 'ap-1' });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('no aplica eventos no aprobados (solo trazabilidad)', async () => {
    mockedFindUnique.mockResolvedValueOnce({ ...PENDING });
    const result = await processBoldEvent({ reference: 'UPW-REF', eventType: 'payment_link.created' });
    expect(result).toEqual({ ok: true, applied: false, paymentId: 'ap-1' });
    expect(mockedUpdate).toHaveBeenCalled();
  });

  it('rechaza referencias desconocidas', async () => {
    mockedFindUnique.mockResolvedValueOnce(null);
    const result = await processBoldEvent({ reference: 'FALSA', eventType: 'payment_link.paid' });
    expect(result.ok).toBe(false);
  });
});

describe('getActivationStatus', () => {
  it('consulta por reference sin exponer datos sensibles', async () => {
    mockedFindUnique.mockResolvedValueOnce({ id: 'ap-1', reference: 'UPW-REF', status: 'PAID' });
    const status = await getActivationStatus('UPW-REF');
    expect(status).toEqual(expect.objectContaining({ reference: 'UPW-REF', status: 'PAID' }));
    expect(mockedFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reference: 'UPW-REF' } }),
    );
  });
});
