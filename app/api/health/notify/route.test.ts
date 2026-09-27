import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/session', () => ({ getHealthSession: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendHealthOnboardingEmail: vi.fn() }));
vi.mock('@/lib/activation', () => ({
  sendActivationReceivedEmail: vi.fn(),
  sendInternalActivationAlert: vi.fn(),
  UPWAY_INTERNAL_REVIEW_EMAIL: 'revision@upway.business',
}));
// Se usa el rate limit REAL: lo que se prueba es que la cuota corta, no que un
// mock devuelva "permitido". Solo se limpian los buckets entre pruebas.
vi.mock('@/lib/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/rate-limit')>()),
}));

import { getHealthSession } from '@/lib/session';
import { sendHealthOnboardingEmail } from '@/lib/email';
import { sendActivationReceivedEmail } from '@/lib/activation';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { POST } from './route';

const mockedSession = getHealthSession as unknown as Mock;
const mockedInternal = sendHealthOnboardingEmail as unknown as Mock;
const mockedAck = sendActivationReceivedEmail as unknown as Mock;

/**
 * AUDITORÍA (pase 3, tenancy) — relay de correo abierto.
 *
 * `POST /api/health/notify` no exigía sesión: proxy.ts deja pasar /api/health/*
 * sin sesión a propósito, y el filtro de origen se salta sin cabecera Origin.
 * El ACK se enviaba a `formData.contactEmail`, o sea a la dirección que eligiera
 * quien llamara, con el nombre y clínica que también eligiera. Sin cuota, nadie
 * podía frenarlo.
 */
const CUERPO = {
  clinicName: 'Clínica Falsa',
  formData: { contactName: 'Attacker', contactEmail: 'victima@ejemplo.com' },
};

function pedir() {
  return new NextRequest('https://upway.business/api/health/notify', {
    method: 'POST',
    body: JSON.stringify(CUERPO),
  });
}

describe('POST /api/health/notify — exige sesión y cuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    mockedSession.mockResolvedValue({ context: { user: 'user-1', clinicId: 'c1' } });
    mockedInternal.mockResolvedValue({ ok: true });
    mockedAck.mockResolvedValue({ ok: true });
  });

  it('responde 401 sin sesión y no envía nada', async () => {
    mockedSession.mockResolvedValue({
      error: NextResponse.json({ error: 'No hay sesión activa.' }, { status: 401 }),
    });

    const res = await POST(pedir());

    expect(res.status).toBe(401);
    // Lo importante: ni un correo sale del servidor.
    expect(mockedInternal).not.toHaveBeenCalled();
    expect(mockedAck).not.toHaveBeenCalled();
  });

  it('con sesión sí notifica', async () => {
    const res = await POST(pedir());
    expect(res.status).toBe(200);
    expect(mockedAck).toHaveBeenCalledWith('victima@ejemplo.com', expect.anything());
  });

  it('corta con 429 al superar la cuota, sin seguir enviando', async () => {
    for (let i = 0; i < 5; i += 1) {
      await POST(pedir());
    }
    expect(mockedInternal).toHaveBeenCalledTimes(5);

    const res = await POST(pedir());

    expect(res.status).toBe(429);
    // Ni el interno ni el ACK: la cuota corta antes de gastar SMTP.
    expect(mockedInternal).toHaveBeenCalledTimes(5);
    expect(mockedAck).toHaveBeenCalledTimes(5);
  });
});