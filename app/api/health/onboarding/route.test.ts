import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn() },
    organization: { create: vi.fn(), findUnique: vi.fn() },
    clinic: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    healthProfile: { upsert: vi.fn() },
    healthOnboardingSession: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    healthOnboardingApproval: { findFirst: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/session', () => ({
  getHealthSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { POST } from './route';

const mockedSession = prisma.healthOnboardingSession as unknown as {
  findFirst: Mock;
  update: Mock;
  create: Mock;
};
const mockedClinicFind = prisma.clinic.findUnique as unknown as Mock;
const mockedApprovalFind = prisma.healthOnboardingApproval.findFirst as unknown as Mock;

/**
 * AUDITORÍA (pase 2, máquina de estados).
 *
 * El endpoint tomaba el estado del cuerpo de la petición, así que una clínica
 * autenticada podía escribirse `APPROVED` a sí misma. Como `lib/case-access.ts`
 * concede clonar/aprovisionar/llamar justo en APPROVED, eso abría la voz —
 *incluida la biometría de un clon— sin aprobación comercial ni pago.
 *
 * Estos tests fijan que el estado se deriva en el servidor.
 */
function pedir(body: Record<string, unknown>) {
  return new NextRequest('https://upway.business/api/health/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Estado que realmente se intenta persistir. */
async function estadoQueSeGuarda(body: Record<string, unknown>) {
  const res = await POST(pedir(body));
  expect(res.status).toBe(200);
  // create y update reciben el mismo shape: `{ where?, data }`.
  const actualizado =
    mockedSession.update.mock.calls[0]?.[0]?.data ??
    mockedSession.create.mock.calls[0]?.[0]?.data;
  expect(actualizado).toBeDefined();
  return actualizado!.status as string;
}

describe('POST /api/health/onboarding — el cliente no decide el estado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getHealthSession as unknown as Mock).mockResolvedValue({
      context: { clinicId: 'clinica-1', organizationId: 'org-1' },
      error: null,
    });
    mockedClinicFind.mockResolvedValue({ id: 'clinica-1', name: 'Clínica Andes' });
    mockedSession.findFirst.mockResolvedValue(null);
    mockedSession.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'sesion-1',
      ...data,
    }));
    mockedSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'sesion-1',
      ...data,
    }));
    mockedApprovalFind.mockResolvedValue({ id: 'aprobacion-1' });
  });

  it('ignora un APPROVED enviado por el cliente', async () => {
    // Escalada de privilegios: el cliente se auto-aprueba.
    const status = await estadoQueSeGuarda({
      currentStep: 'clinic-setup',
      status: 'APPROVED',
      formData: {},
    });
    expect(status).not.toBe('APPROVED');
    expect(status).toBe('DRAFT');
  });

  it('ignora un ACTIVE enviado por el cliente, aun con approval=true', async () => {
    // Ni siquiera mandando la casilla de aprobación clínica.
    const status = await estadoQueSeGuarda({
      currentStep: 'go-live',
      status: 'ACTIVE',
      formData: { approval: true },
    });
    expect(status).not.toBe('ACTIVE');
  });

  it('no acepta ningún estado que solo decide Upway', async () => {
    for (const prohibido of ['TESTING', 'PAUSED', 'BLOCKED', 'ARCHIVED']) {
      vi.clearAllMocks();
      mockedClinicFind.mockResolvedValue({ id: 'clinica-1', name: 'Clínica Andes' });
      mockedSession.findFirst.mockResolvedValue(null);
      mockedSession.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'sesion-1',
        ...data,
      }));
      mockedApprovalFind.mockResolvedValue({ id: 'aprobacion-1' });
      const status = await estadoQueSeGuarda({
        currentStep: 'clinic-setup',
        status: prohibido,
        formData: {},
      });
      expect(status).not.toBe(prohibido);
    }
  });

  it('sí acepta PENDING_REVIEW: es lo que el wizard envía al terminar', async () => {
    const status = await estadoQueSeGuarda({
      currentStep: 'go-live',
      status: 'PENDING_REVIEW',
      formData: {},
    });
    expect(status).toBe('PENDING_REVIEW');
  });

  it('sí acepta NEEDS_CHANGES: pedir ajustes sobre lo propio es legítimo', async () => {
    const status = await estadoQueSeGuarda({
      currentStep: 'review-and-approve',
      status: 'NEEDS_CHANGES',
      formData: {},
    });
    expect(status).toBe('NEEDS_CHANGES');
  });

  it('deriva IN_PROGRESS del paso cuando el cliente no manda estado', async () => {
    const status = await estadoQueSeGuarda({ currentStep: 'triage-rules', formData: {} });
    expect(status).toBe('IN_PROGRESS');
  });

  it('no baja un caso ya aprobado al navegar hacia atrás', async () => {
    mockedSession.findFirst.mockResolvedValue({ id: 'sesion-1', status: 'APPROVED' });
    const res = await POST(pedir({ currentStep: 'clinic-setup', status: 'DRAFT', formData: {} }));
    expect(res.status).toBe(200);
    // La protección de REVIEW_LOCKED se mantiene.
    expect(mockedSession.update.mock.calls[0][0].data.status).toBe('APPROVED');
  });
});