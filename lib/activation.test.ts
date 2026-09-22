import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activationPayment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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
  computeBoldLinkExpiry: vi.fn(() => new Date('2026-09-21T10:00:00Z')),
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
const mockedFindFirst = (prisma as any).activationPayment.findFirst as unknown as Mock;
const mockedFindUnique = (prisma as any).activationPayment.findUnique as unknown as Mock;
const mockedUpdate = (prisma as any).activationPayment.update as unknown as Mock;
const mockedBold = createBoldPaymentLink as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindFirst.mockResolvedValue(null);
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

  it('persiste y envia a Bold la vigencia del link (expiresAt)', async () => {
    await createActivationPaymentLink({
      planId: 'consultorio-600',
      customerEmail: 'ips@test.co',
    });

    // Se guarda en la DB para poder reportar el vencimiento sin depender de Bold.
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expiresAt: expect.any(Date) }),
      }),
    );
    // Y viaja a Bold como expiration_date.
    expect(mockedBold).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: expect.any(Date) }),
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

  it('conserva la tarifa del cliente que firmó antes de la vigencia (grandfathering)', async () => {
    mockedFindFirst.mockResolvedValueOnce({ createdAt: new Date('2026-08-15T12:00:00Z') });
    const result = await createActivationPaymentLink({
      planId: 'consultorio-600',
      customerEmail: 'cliente-viejo@test.co',
      organizationId: 'org-1',
    });

    expect(result.ok).toBe(true);
    // Tarifa vigente del cliente: $769.000 + setup $590.000, ambos con IVA.
    const expectedLegacy = withIVA(769000) + withIVA(590000);
    expect(mockedBold).toHaveBeenCalledWith(expect.objectContaining({ amountCOP: expectedLegacy }));
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountCOP: expectedLegacy,
          statusMessage: expect.stringContaining('tarifa vigente del cliente'),
        }),
      }),
    );
  });

  it('a un cliente nuevo le aplica la tarifa final', async () => {
    const result = await createActivationPaymentLink({
      planId: 'consultorio-600',
      customerEmail: 'cliente-nuevo@test.co',
      organizationId: 'org-2',
    });

    expect(result.ok).toBe(true);
    const expectedFinal = withIVA(429000) + withIVA(390000);
    expect(mockedBold).toHaveBeenCalledWith(expect.objectContaining({ amountCOP: expectedFinal }));
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

  it('marca expired cuando la vigencia paso y el intento sigue PENDING', async () => {
    mockedFindUnique.mockResolvedValueOnce({
      reference: 'UPW-REF',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 86400000),
    });
    const status = await getActivationStatus('UPW-REF');
    expect(status?.expired).toBe(true);
  });

  it('no marca expired si la vigencia sigue vigente o el pago ya se realizo', async () => {
    mockedFindUnique.mockResolvedValueOnce({
      reference: 'UPW-REF',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000),
    });
    const vigente = await getActivationStatus('UPW-REF');
    expect(vigente?.expired).toBe(false);

    mockedFindUnique.mockResolvedValueOnce({
      reference: 'UPW-REF',
      status: 'PAID',
      expiresAt: new Date(Date.now() - 86400000),
    });
    const pagado = await getActivationStatus('UPW-REF');
    expect(pagado?.expired).toBe(false);
  });

  it('devuelve null si la referencia no existe', async () => {
    mockedFindUnique.mockResolvedValueOnce(null);
    expect(await getActivationStatus('NO-EXISTE')).toBeNull();
  });
});
