import { IDENTITY_PAYLOAD_VERSION } from './persistence';

/**
 * Entrega push del registro conforme al HIS/HCE del cliente (Patrón 3 del
 * handoff — ver docs/INTEGRACION-API-IDENTIDAD.md §6).
 *
 * Este módulo es la POLÍTICA PURA de la entrega: validación del destino,
 * armado del payload versionado, clave de idempotencia, clasificación de la
 * respuesta HTTP y agenda de reintentos. El IO (fetch y base de datos) vive en
 * app/api/health/identity/handoffs/route.ts (drenaje) y en
 * app/api/tools/agenda/route.ts (encolado).
 *
 * Reglas:
 * - Idempotencia: cada versión del registro (recordHash + marca de
 *   confirmación) produce UNA clave estable. Los reintentos reutilizan la
 *   misma clave para que el HIS pueda descartar duplicados; un dato
 *   actualizado (o la confirmación del paciente) genera clave nueva y por
 *   tanto una entrega nueva.
 * - Reintentos: 2xx = entregada. 4xx (salvo 408/429) = rechazo definitivo, no
 *   se reintenta: es un problema de integración que la bitácora expone. Los
 *   5xx/429/408 y los fallos de red se reintentan con espera creciente hasta
 *   HANDOFF_MAX_ATTEMPTS.
 * - Destino: solo HTTPS (o http://localhost en desarrollo). Un HIS no expone
 *   su endpoint clínico en texto plano.
 */

export const HANDOFF_EVENT = 'identity.certified';
export const HANDOFF_PAYLOAD_VERSION = '2026-10-v1';
export const HANDOFF_IDEMPOTENCY_HEADER = 'x-upway-idempotency-key';
export const HANDOFF_HTTP_TIMEOUT_MS = 5000;
export const HANDOFF_MAX_ATTEMPTS = 4;
export const HANDOFF_RETRY_BASE_MS = 30_000;
export const HANDOFF_RETRY_CAP_MS = 10 * 60_000;

export type HandoffOutcome = 'DELIVERED' | 'RETRY' | 'REJECTED';
export type HandoffAttemptStatus = 'DELIVERED' | 'PENDING' | 'FAILED';

/** Destino válido para entrega push: HTTPS, o localhost/127.0.0.1 en pruebas. */
export function isDeliverableHandoffUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'https:') return true;
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

export type HandoffIdentityForPush = {
  id: string;
  recordHash: string;
  confirmedAt: Date | null;
};

/**
 * Clave de idempotencia de una entrega push. Estable para una misma versión
 * del registro (los reintentos la reutilizan); cambia cuando el dato cambia
 * (recordHash) o cuando el paciente confirma (confirmedAt).
 */
export function pushIdempotencyKey(clientId: string, identity: HandoffIdentityForPush): string {
  const confirmMark = identity.confirmedAt ? identity.confirmedAt.getTime() : 0;
  return `push:${clientId}:${identity.id}:${identity.recordHash}:${confirmMark}`;
}

export type HandoffPayloadPatient = {
  /** `id` de PatientIdentity: referencia de evidencia para auditoría. */
  id: string;
  documentType: string;
  documentNumber: string;
  givenNames: string[];
  familyNames: string[];
  /** Fecha de nacimiento como YYYY-MM-DD (zona UTC, sin hora ni zona). */
  birthDate: string;
  sexCode: string;
  municipalityCode: string;
  departmentCode: string;
  phoneE164: string | null;
  email: string | null;
  recordHash: string;
  completenessPct: number;
  conforming: boolean;
  /** ISO-8601 de la confirmación del paciente, o null si aún no confirma. */
  confirmedAt: string | null;
  /** ISO-8601 de cuándo se certificó (createdAt del registro). */
  certifiedAt: string;
};

/** Payload versionado que recibe el webhook del cliente. */
export function buildHandoffPayload(
  patient: HandoffPayloadPatient,
  delivery: { idempotencyKey: string; attempt: number },
) {
  return {
    event: HANDOFF_EVENT,
    version: HANDOFF_PAYLOAD_VERSION,
    delivery: {
      idempotencyKey: delivery.idempotencyKey,
      attempt: delivery.attempt,
      certifiedAt: patient.certifiedAt,
    },
    patient: {
      evidenceRef: patient.id,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      givenNames: patient.givenNames,
      familyNames: patient.familyNames,
      birthDate: patient.birthDate,
      sexCode: patient.sexCode,
      municipalityCode: patient.municipalityCode,
      departmentCode: patient.departmentCode,
      phoneE164: patient.phoneE164,
      email: patient.email,
    },
    certification: {
      conforming: patient.conforming,
      completenessPct: patient.completenessPct,
      confirmedAt: patient.confirmedAt,
      recordHash: patient.recordHash,
      payloadVersion: IDENTITY_PAYLOAD_VERSION,
    },
  };
}

/** Clasifica la respuesta HTTP del destino (null = fallo de red/timeout). */
export function classifyHandoffResponse(httpStatus: number | null): HandoffOutcome {
  if (httpStatus === null) return 'RETRY';
  if (httpStatus >= 200 && httpStatus < 300) return 'DELIVERED';
  if (httpStatus === 408 || httpStatus === 429 || httpStatus >= 500) return 'RETRY';
  return 'REJECTED';
}

/** Espera creciente tras `attemptsMade` intentos: 30s, 60s, 120s… con tope. */
export function handoffBackoffMs(attemptsMade: number): number {
  const exponent = Math.max(1, attemptsMade) - 1;
  return Math.min(HANDOFF_RETRY_BASE_MS * 2 ** exponent, HANDOFF_RETRY_CAP_MS);
}

export type HandoffAttemptPlan = {
  status: HandoffAttemptStatus;
  attempts: number;
  deliveredAt: Date | null;
  lastError: string | null;
  nextAttemptAt: Date | null;
};

/**
 * Calcula el estado a persistir tras un intento de entrega.
 * `attempts` = intentos previos registrados (el intento actual no va incluido).
 */
export function planHandoffAttempt(args: {
  attempts: number;
  httpStatus: number | null;
  networkError?: string | null;
  now: Date;
}): HandoffAttemptPlan {
  const outcome = classifyHandoffResponse(args.httpStatus);
  const attempts = args.attempts + 1;
  const label =
    args.httpStatus === null
      ? `sin respuesta (${args.networkError ?? 'red/timeout'})`
      : `HTTP ${args.httpStatus}`;

  if (outcome === 'DELIVERED') {
    return { status: 'DELIVERED', attempts, deliveredAt: args.now, lastError: null, nextAttemptAt: null };
  }
  if (outcome === 'REJECTED') {
    return {
      status: 'FAILED',
      attempts,
      deliveredAt: null,
      lastError: `rechazado por el destino (${label})`,
      nextAttemptAt: null,
    };
  }
  if (attempts >= HANDOFF_MAX_ATTEMPTS) {
    return {
      status: 'FAILED',
      attempts,
      deliveredAt: null,
      lastError: `agotado tras ${attempts} intentos (último: ${label})`,
      nextAttemptAt: null,
    };
  }
  return {
    status: 'PENDING',
    attempts,
    deliveredAt: null,
    lastError: label,
    nextAttemptAt: new Date(args.now.getTime() + handoffBackoffMs(attempts)),
  };
}
