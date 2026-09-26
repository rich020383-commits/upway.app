import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks antes de importar el módulo bajo test: el route vincula prisma, la
// sesión y los correos en tiempo de importación.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    tienda: { findFirst: vi.fn() },
    verticalOnboardingSession: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendVerticalOnboardingEmail: vi.fn(),
}));
vi.mock('@/lib/activation', () => ({
  sendActivationReceivedEmail: vi.fn(),
  sendInternalActivationAlert: vi.fn(),
  UPWAY_INTERNAL_REVIEW_EMAIL: 'activacion@upway.business',
}));

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { sendVerticalOnboardingEmail } from '@/lib/email';
import { sendActivationReceivedEmail, sendInternalActivationAlert } from '@/lib/activation';
import { STANDARD_INMOB_PLANS } from '@/lib/inmobiliaria/plans';
import { GET, POST } from './route';

const mockedSession = getSessionUser as unknown as Mock;
const mockedUserFind = prisma.user.findFirst as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;
const mockedSessionFind = prisma.verticalOnboardingSession.findUnique as unknown as Mock;
const mockedUpsert = prisma.verticalOnboardingSession.upsert as unknown as Mock;
const mockedInternalEmail = sendVerticalOnboardingEmail as unknown as Mock;
const mockedClientAck = sendActivationReceivedEmail as unknown as Mock;
const mockedAlert = sendInternalActivationAlert as unknown as Mock;

/** Inmobiliaria tiene 7 etapas: el ultimo indice valido es 6. */
const LAST_STEP = 6;
const TOTAL_STAGES = 7;

const VALID_ANSWERS = {
  empresa: 'Inmobiliaria Norte',
  ciudad: 'Bogotá',
  encargado: 'Ana Pérez',
  contactoEmail: 'ana@norte.com',
  contacto: '+57 300 000 0000',
  volumen: '50–200 consultas/mes',
  planId: STANDARD_INMOB_PLANS[0].id,
  inmuebles: 'Chapinero y Usaquén',
  tarea: 'Agendar visitas y asesorías',
  horario: 'Lun a Sáb 8:00–18:00',
  faqs: '¿Agendan visitas sin cita?',
  integracion: 'Solo llamadas y mensajes (recomendado)',
};

const get = (segment: string) =>
  new NextRequest(`http://localhost/api/onboarding?segment=${segment}`);

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const storedSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'vos-1',
  answers: '{}',
  currentStep: 0,
  status: 'DRAFT',
  caseRef: null,
  submittedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedSession.mockResolvedValue({ id: 'user-1', email: 'ana@norte.com', name: 'Ana' });
  mockedUserFind.mockResolvedValue({ id: 'user-1' });
  mockedTiendaFind.mockResolvedValue({ organizationId: 'org-1', clinicId: 'clinic-1' });
  mockedSessionFind.mockResolvedValue(null);
  mockedUpsert.mockResolvedValue({ id: 'vos-1' });
  mockedInternalEmail.mockResolvedValue({ ok: true });
  mockedClientAck.mockResolvedValue({ ok: true });
  mockedAlert.mockResolvedValue(undefined);
});

describe('GET /api/onboarding — persistencia del wizard vertical', () => {
  it('responde 401 sin sesión', async () => {
    mockedSession.mockResolvedValue(null);
    const res = await GET(get('inmobiliaria'));
    expect(res.status).toBe(401);
  });

  it('responde 400 con un segmento sin wizard propio', async () => {
    const res = await GET(get('retail'));
    expect(res.status).toBe(400);
  });

  it('sin avance guardado devuelve el formulario en blanco y la activación', async () => {
    const res = await GET(get('inmobiliaria'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answers).toEqual({});
    expect(data.step).toBe(0);
    expect(data.status).toBeNull();
    expect(data.activation).toEqual({
      sede: true,
      agenteNombre: null,
      numeroTexto: null,
      vozLabel: null,
      pasos: { sede: true, asistente: false, numero: false, voz: false, encendida: false },
    });
  });

  it('devuelve el avance guardado y acota el paso al rango del wizard', async () => {
    mockedSessionFind.mockResolvedValue(
      storedSession({
        answers: JSON.stringify({ empresa: 'Norte', planId: 'x' }),
        currentStep: 99,
        status: 'IN_PROGRESS',
      })
    );

    const data = await (await GET(get('inmobiliaria'))).json();

    expect(data.answers.empresa).toBe('Norte');
    expect(data.step).toBe(LAST_STEP);
    expect(data.status).toBe('IN_PROGRESS');
  });

  it('tolera respuestas corruptas en base de datos', async () => {
    mockedSessionFind.mockResolvedValue(
      storedSession({ answers: 'esto-no-es-json', currentStep: 2 })
    );

    const data = await (await GET(get('inmobiliaria'))).json();

    expect(data.answers).toEqual({});
    expect(data.step).toBe(2);
  });

  it('resuelve el tenant por correo cuando el token no trae el id real', async () => {
    mockedSession.mockResolvedValue({ id: 'ana@norte.com', email: 'ana@norte.com' });

    await GET(get('inmobiliaria'));

    const orArgument = mockedUserFind.mock.calls[0][0].where.OR;
    expect(orArgument).toEqual([{ id: 'ana@norte.com' }, { email: 'ana@norte.com' }]);
  });
});

describe('GET /api/onboarding — estado de activación que ve el cliente', () => {
  const tiendaVacia = { organizationId: 'org-1', clinicId: 'clinic-1' };

  it('marca cada paso según lo que está realmente configurado', async () => {
    mockedTiendaFind.mockResolvedValue({
      ...tiendaVacia,
      nombre: 'Inmobiliaria Norte',
      agentName: 'Ana',
      telnyxPhoneNumber: '+573001112233',
      telnyxAssistantId: 'assistant-1',
      isTelnyxActive: true,
      agentVoice: 'Telnyx.female.sofia',
      agentVoiceLabel: 'Sofía',
    });

    const data = await (await GET(get('inmobiliaria'))).json();

    expect(data.activation.pasos).toEqual({
      sede: true,
      asistente: true,
      numero: true,
      voz: true,
      encendida: true,
    });
    expect(data.activation.numeroTexto).toBe('+573001112233');
    expect(data.activation.vozLabel).toBe('Sofía');
  });

  it('NO expone los identificadores internos del proveedor', async () => {
    mockedTiendaFind.mockResolvedValue({
      ...tiendaVacia,
      agentVoice: 'Telnyx.female.sofia',
      telnyxAssistantId: 'assistant-secreto-123',
    });

    const crudo = JSON.stringify(await (await GET(get('inmobiliaria'))).json());

    expect(crudo).not.toContain('assistant-secreto-123');
    expect(crudo).not.toContain('Telnyx.female.sofia');
    // El id de la sede es interno: tampoco debe viajar.
    expect(crudo).not.toContain('org-1');
  });

  it('sin sede devuelve todos los pasos en false en vez de fallar', async () => {
    mockedTiendaFind.mockResolvedValue(null);

    const data = await (await GET(get('inmobiliaria'))).json();

    expect(data.activation.sede).toBe(false);
    expect(data.activation.pasos).toEqual({
      sede: false,
      asistente: false,
      numero: false,
      voz: false,
      encendida: false,
    });
  });
});

describe('POST /api/onboarding — borrador y envío a revisión', () => {
  it('responde 401 sin sesión', async () => {
    mockedSession.mockResolvedValue(null);
    const res = await POST(post({ segment: 'inmobiliaria', answers: {} }));
    expect(res.status).toBe(401);
  });

  it('responde 400 si answers no es un objeto', async () => {
    const res = await POST(post({ segment: 'inmobiliaria', answers: 'texto' }));
    expect(res.status).toBe(400);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('guarda el borrador con el paso actual y el tenant vinculado', async () => {
    const res = await POST(
      post({ segment: 'inmobiliaria', answers: { empresa: 'Norte' }, step: 2, stageId: 'plan' })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('IN_PROGRESS');
    expect(mockedUpsert).toHaveBeenCalledTimes(1);

    const { create } = mockedUpsert.mock.calls[0][0];
    expect(create.userId).toBe('user-1');
    expect(create.organizationId).toBe('org-1');
    expect(create.clinicId).toBe('clinic-1');
    expect(create.segment).toBe('inmobiliaria');
    expect(create.currentStep).toBe(2);
    expect(create.progressPercent).toBe(Math.round((2 / TOTAL_STAGES) * 100));
    expect(JSON.parse(create.answers).empresa).toBe('Norte');
    // Un borrador no notifica a nadie.
    expect(mockedInternalEmail).not.toHaveBeenCalled();
    expect(mockedAlert).not.toHaveBeenCalled();
  });

  it('no degrada una solicitud ya enviada si el cliente retrocede', async () => {
    mockedSessionFind.mockResolvedValue(
      storedSession({ status: 'PENDING_REVIEW', caseRef: 'UPW-ONB-VIEJO', currentStep: LAST_STEP })
    );

    const res = await POST(
      post({ segment: 'inmobiliaria', answers: VALID_ANSWERS, step: 3, submit: false })
    );
    const body = await res.json();

    expect(body.status).toBe('PENDING_REVIEW');
    expect(body.caseRef).toBe('UPW-ONB-VIEJO');
    expect(mockedUpsert.mock.calls[0][0].update.status).toBe('PENDING_REVIEW');
  });

  it('responde 422 con la etapa culpable y no persiste ni notifica', async () => {
    const res = await POST(
      post({ segment: 'inmobiliaria', answers: { empresa: 'Norte' }, step: LAST_STEP, submit: true })
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('incomplete');
    expect(typeof body.stageId).toBe('string');
    expect(body.errors.length).toBeGreaterThan(0);
    expect(mockedUpsert).not.toHaveBeenCalled();
    expect(mockedInternalEmail).not.toHaveBeenCalled();
  });

  it('envía a revisión: persiste PENDING_REVIEW al 100% y notifica a equipo y cliente', async () => {
    const res = await POST(
      post({
        segment: 'inmobiliaria',
        answers: VALID_ANSWERS,
        step: LAST_STEP,
        stageId: 'resumen',
        submit: true,
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('PENDING_REVIEW');
    expect(body.caseRef).toMatch(/^UPW-ONB-/);
    expect(body.clientNotified).toBe(true);

    const { create } = mockedUpsert.mock.calls[0][0];
    expect(create.status).toBe('PENDING_REVIEW');
    expect(create.currentStep).toBe(LAST_STEP);
    expect(create.progressPercent).toBe(100);
    expect(create.caseRef).toBe(body.caseRef);
    expect(create.submittedAt).toBeInstanceOf(Date);

    expect(mockedInternalEmail).toHaveBeenCalledTimes(1);
    expect(mockedClientAck).toHaveBeenCalledTimes(1);
    expect(mockedAlert).toHaveBeenCalledTimes(1);
  });

  it('mantiene el mismo caseRef al reintentar el envío', async () => {
    mockedSessionFind.mockResolvedValue(storedSession({ caseRef: 'UPW-ONB-ESTABLE' }));

    const res = await POST(
      post({ segment: 'inmobiliaria', answers: VALID_ANSWERS, step: LAST_STEP, submit: true })
    );
    const body = await res.json();

    expect(body.caseRef).toBe('UPW-ONB-ESTABLE');
  });

  it('si el correo interno falla, el caso igual queda guardado y se avisa', async () => {
    mockedInternalEmail.mockResolvedValue({ ok: false, error: 'SMTP_NOT_CONFIGURED' });

    const res = await POST(
      post({ segment: 'inmobiliaria', answers: VALID_ANSWERS, step: LAST_STEP, submit: true })
    );
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.status).toBe('PENDING_REVIEW');
    expect(body.warning).toMatch(/Correo no configurado/);
    // Lo importante: el caso no se pierde aunque el correo no salga.
    expect(mockedUpsert).toHaveBeenCalledTimes(1);
    expect(mockedUpsert.mock.calls[0][0].create.status).toBe('PENDING_REVIEW');
  });

  it('acepta también el wizard de Center', async () => {
    const res = await POST(
      post({ segment: 'center', answers: { empresa: 'ServiTech' }, step: 1 })
    );

    expect(res.status).toBe(200);
    const { create } = mockedUpsert.mock.calls[0][0];
    expect(create.segment).toBe('center');
    expect(create.progressPercent).toBe(Math.round((1 / TOTAL_STAGES) * 100));
  });
});
