import { describe, expect, it } from 'vitest';
import {
  HANDOFF_HTTP_TIMEOUT_MS,
  HANDOFF_MAX_ATTEMPTS,
  HANDOFF_RETRY_BASE_MS,
  HANDOFF_RETRY_CAP_MS,
  buildHandoffPayload,
  classifyHandoffResponse,
  handoffBackoffMs,
  isDeliverableHandoffUrl,
  planHandoffAttempt,
  pushIdempotencyKey,
  type HandoffPayloadPatient,
} from './handoff';

function patientFixture(overrides: Partial<HandoffPayloadPatient> = {}): HandoffPayloadPatient {
  return {
    id: 'cm_identity_1',
    documentType: 'CC',
    documentNumber: '15802345',
    givenNames: ['Juan'],
    familyNames: ['Perez'],
    birthDate: '1971-08-08',
    sexCode: 'M',
    municipalityCode: '11001',
    departmentCode: '11',
    phoneE164: '+573001112233',
    email: 'juan@example.com',
    recordHash: 'a'.repeat(64),
    completenessPct: 100,
    conforming: true,
    confirmedAt: null,
    certifiedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('handoff — validacion del destino', () => {
  it('acepta un endpoint HTTPS', () => {
    expect(isDeliverableHandoffUrl('https://his.clinica.co/hooks/upway')).toBe(true);
  });

  it('acepta localhost en pruebas (con y sin puerto)', () => {
    expect(isDeliverableHandoffUrl('http://localhost:4321/hook')).toBe(true);
    expect(isDeliverableHandoffUrl('http://127.0.0.1/hook')).toBe(true);
  });

  it('rechaza http remoto, otras rutas y basura', () => {
    expect(isDeliverableHandoffUrl('http://his.clinica.co/hook')).toBe(false);
    expect(isDeliverableHandoffUrl('ftp://his.clinica.co/hook')).toBe(false);
    expect(isDeliverableHandoffUrl('')).toBe(false);
    expect(isDeliverableHandoffUrl('   ')).toBe(false);
    expect(isDeliverableHandoffUrl(null)).toBe(false);
    expect(isDeliverableHandoffUrl(undefined)).toBe(false);
    expect(isDeliverableHandoffUrl('no es una url')).toBe(false);
  });
});

describe('handoff — clave de idempotencia', () => {
  const identity = { id: 'cm_identity_1', recordHash: 'a'.repeat(64), confirmedAt: null as Date | null };

  it('es estable para el mismo estado (los reintentos reutilizan la clave)', () => {
    const first = pushIdempotencyKey('client_1', identity);
    const retry = pushIdempotencyKey('client_1', { ...identity });
    expect(retry).toBe(first);
  });

  it('incluye cliente, identidad, hash y marca de confirmacion', () => {
    expect(pushIdempotencyKey('client_1', identity)).toBe(`push:client_1:cm_identity_1:${'a'.repeat(64)}:0`);
  });

  it('cambia si cambia el dato (recordHash) o la confirmacion', () => {
    const base = pushIdempotencyKey('client_1', identity);
    expect(pushIdempotencyKey('client_1', { ...identity, recordHash: 'b'.repeat(64) })).not.toBe(base);
    expect(pushIdempotencyKey('client_1', { ...identity, confirmedAt: new Date('2026-10-01T12:30:00Z') })).not.toBe(base);
    expect(pushIdempotencyKey('client_2', identity)).not.toBe(base);
  });
});

describe('handoff — payload versionado', () => {
  it('arma el evento con version, entrega e integridad', () => {
    const payload = buildHandoffPayload(patientFixture(), { idempotencyKey: 'push:client_1:cm_identity_1:aaa:0', attempt: 1 });

    expect(payload.event).toBe('identity.certified');
    expect(payload.version).toBe('2026-10-v1');
    expect(payload.delivery).toEqual({
      idempotencyKey: 'push:client_1:cm_identity_1:aaa:0',
      attempt: 1,
      certifiedAt: '2026-10-01T12:00:00.000Z',
    });
    expect(payload.patient.evidenceRef).toBe('cm_identity_1');
    expect(payload.patient.documentType).toBe('CC');
    expect(payload.patient.documentNumber).toBe('15802345');
    expect(payload.patient.birthDate).toBe('1971-08-08');
    expect(payload.certification).toEqual({
      conforming: true,
      completenessPct: 100,
      confirmedAt: null,
      recordHash: 'a'.repeat(64),
      payloadVersion: 'v1',
    });
  });

  it('propaga la confirmacion y los opcionales sin inventar datos', () => {
    const payload = buildHandoffPayload(
      patientFixture({ confirmedAt: '2026-10-01T12:30:00.000Z', phoneE164: null, email: null }),
      { idempotencyKey: 'k', attempt: 2 },
    );
    expect(payload.certification.confirmedAt).toBe('2026-10-01T12:30:00.000Z');
    expect(payload.patient.phoneE164).toBeNull();
    expect(payload.patient.email).toBeNull();
    expect(payload.delivery.attempt).toBe(2);
  });
});

describe('handoff — clasificacion de respuesta', () => {
  it('2xx es entregada', () => {
    expect(classifyHandoffResponse(200)).toBe('DELIVERED');
    expect(classifyHandoffResponse(204)).toBe('DELIVERED');
  });

  it('408, 429, 5xx y fallo de red se reintentan', () => {
    expect(classifyHandoffResponse(408)).toBe('RETRY');
    expect(classifyHandoffResponse(429)).toBe('RETRY');
    expect(classifyHandoffResponse(500)).toBe('RETRY');
    expect(classifyHandoffResponse(503)).toBe('RETRY');
    expect(classifyHandoffResponse(null)).toBe('RETRY');
  });

  it('el resto de 4xx es rechazo definitivo', () => {
    expect(classifyHandoffResponse(400)).toBe('REJECTED');
    expect(classifyHandoffResponse(401)).toBe('REJECTED');
    expect(classifyHandoffResponse(404)).toBe('REJECTED');
    expect(classifyHandoffResponse(422)).toBe('REJECTED');
  });
});

describe('handoff — espera creciente', () => {
  it('crece al doble y respeta el tope', () => {
    expect(handoffBackoffMs(1)).toBe(HANDOFF_RETRY_BASE_MS);
    expect(handoffBackoffMs(2)).toBe(2 * HANDOFF_RETRY_BASE_MS);
    expect(handoffBackoffMs(3)).toBe(4 * HANDOFF_RETRY_BASE_MS);
    expect(handoffBackoffMs(20)).toBe(HANDOFF_RETRY_CAP_MS);
  });
});

describe('handoff — plan de intento', () => {
  const now = new Date('2026-10-01T12:00:00.000Z');

  it('2xx marca entregada con fecha y sin reintento', () => {
    const plan = planHandoffAttempt({ attempts: 0, httpStatus: 200, now });
    expect(plan).toEqual({ status: 'DELIVERED', attempts: 1, deliveredAt: now, lastError: null, nextAttemptAt: null });
  });

  it('5xx programa reintento con espera y deja el error visible', () => {
    const plan = planHandoffAttempt({ attempts: 0, httpStatus: 500, now });
    expect(plan.status).toBe('PENDING');
    expect(plan.attempts).toBe(1);
    expect(plan.lastError).toBe('HTTP 500');
    expect(plan.nextAttemptAt?.getTime()).toBe(now.getTime() + HANDOFF_RETRY_BASE_MS);
  });

  it('fallo de red registra el motivo', () => {
    const plan = planHandoffAttempt({ attempts: 1, httpStatus: null, networkError: 'The operation was aborted', now });
    expect(plan.status).toBe('PENDING');
    expect(plan.lastError).toContain('The operation was aborted');
    expect(plan.nextAttemptAt?.getTime()).toBe(now.getTime() + handoffBackoffMs(2));
  });

  it('4xx definitivo no se reintenta jamas', () => {
    const plan = planHandoffAttempt({ attempts: 0, httpStatus: 404, now });
    expect(plan.status).toBe('FAILED');
    expect(plan.lastError).toContain('rechazado por el destino (HTTP 404)');
    expect(plan.nextAttemptAt).toBeNull();
  });

  it('al agotar los intentos queda fallida con el conteo', () => {
    const plan = planHandoffAttempt({ attempts: HANDOFF_MAX_ATTEMPTS - 1, httpStatus: 503, now });
    expect(plan.status).toBe('FAILED');
    expect(plan.attempts).toBe(HANDOFF_MAX_ATTEMPTS);
    expect(plan.lastError).toContain(`agotado tras ${HANDOFF_MAX_ATTEMPTS} intentos`);
    expect(plan.nextAttemptAt).toBeNull();
  });

  it('el timeout de entrega es acotado (no bloquea el drenaje)', () => {
    expect(HANDOFF_HTTP_TIMEOUT_MS).toBeLessThanOrEqual(10_000);
  });
});
