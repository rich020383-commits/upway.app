/**
 * Persistencia de identidad conforme (Upway Health) - Fase 1.
 *
 * Este modulo tiene dos mitades:
 *   1. Funciones PURAS (abajo): construyen el registro y su hash de integridad.
 *      Deterministas, sin base de datos, 100% testeables.
 *   2. Mapeo al modelo Prisma `PatientIdentity`.
 *
 * REGLA DE ORO: nada probabilistico escribe en un campo conforme.
 * El hash existe para poder probar despues que el dato almacenado no se altero.
 *
 * Upway NO crea pacientes por su cuenta en el HIS del cliente: entrega la clave
 * de match (documentType + documentNumber) y el HIS decide si actualiza o crea.
 * Ver REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md §5.4 y §5.5.
 */

import { createHash } from 'node:crypto';
import type { ConformingIdentity, ConformanceReport } from './conformingRecord';

/** Se incrementa si cambia la forma del payload canonico (invalida hashes previos). */
export const IDENTITY_PAYLOAD_VERSION = 'v1';

export type IdentityRetentionMode = 'TRANSIENT' | 'CUSTODY';

export type IdentityScope = {
  organizationId: string;
  clinicId?: string | null;
};

/**
 * Campos que entran al hash de integridad.
 * Existe para que construir el registro (build) y verificarlo (verify) usen
 * EXACTAMENTE la misma forma: si uno normaliza y el otro no, el hash nunca cuadra.
 */
export type HashableIdentity = Pick<
  ConformingIdentity,
  | 'documentType'
  | 'documentNumber'
  | 'givenNames'
  | 'familyNames'
  | 'birthDate'
  | 'sexCode'
  | 'municipalityCode'
  | 'departmentCode'
  | 'phoneE164'
  | 'email'
>;

/**
 * Normaliza un componente de nombre para el hash.
 * El hash debe ser estable y no depender de mayusculas ni espacios sobrantes.
 */
function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Normaliza un telefono a su forma E.164 compacta: se quitan espacios (incluido
 * el no separable), guiones, parentesis y puntos; el '+' inicial se conserva.
 *
 * Es LA unica normalizacion de telefono del modulo, y se usa en dos lugares que
 * antes divergian:
 *   - al construir la fila (`buildPatientIdentityData`), para persistir limpio
 *   - dentro del payload canonico, para que el hash sea estable
 * Si ambos caminos no normalizan igual, el hash de un telefono dictado con
 * espacios ("  +57 300 1234567") no cuadraria nunca al verificar la fila.
 */
export function normalizePhoneE164(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/[\s\u00A0().-]/g, '');
  return compact.length > 0 ? compact : null;
}

/**
 * Payload canonico: orden de claves fijo y componentes normalizados.
 * Dos certificaciones identicas producen exactamente el mismo string.
 */
export function canonicalIdentityPayload(identity: HashableIdentity): string {
  return JSON.stringify({
    v: IDENTITY_PAYLOAD_VERSION,
    dt: identity.documentType,
    dn: identity.documentNumber.trim().toUpperCase(),
    gn: identity.givenNames.map(normalizeToken),
    fn: identity.familyNames.map(normalizeToken),
    bd: identity.birthDate,
    sx: identity.sexCode,
    mc: identity.municipalityCode,
    dc: identity.departmentCode,
    ph: normalizePhoneE164(identity.phoneE164),
    em: identity.email ? identity.email.trim().toLowerCase() : null,
  });
}

/** sha256 del payload canonico. Es la evidencia de integridad del registro. */
export function identityRecordHash(identity: HashableIdentity): string {
  return createHash('sha256').update(canonicalIdentityPayload(identity), 'utf8').digest('hex');
}

/**
 * Convierte 'YYYY-MM-DD' a Date en medianoche UTC.
 * Se hace explicitamente para que @db.Date no derive por zona horaria:
 * en Colombia (UTC-5) un Date local se guardaria como el dia anterior.
 */
export function toDateOnlyUtc(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    throw new Error(`Fecha ISO invalida: ${isoDate}. Se espera YYYY-MM-DD.`);
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Fecha ISO inexistente: ${isoDate}.`);
  }
  return date;
}

/**
 * Inverso de `toDateOnlyUtc`. Necesario para poder recalcular el hash a partir
 * de una fila ya guardada: `@db.Date` vuelve como Date en medianoche UTC, asi
 * que la fecha se lee siempre en UTC, nunca en hora local del servidor.
 */
export function isoDateOnlyFromUtc(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha invalida: no se puede derivar YYYY-MM-DD.');
  }
  return date.toISOString().slice(0, 10);
}

/** Payload listo para `prisma.patientIdentity.create({ data })`. */
export type PatientIdentityData = {
  organizationId: string;
  clinicId: string | null;
  documentType: string;
  documentNumber: string;
  givenNames: string[];
  familyNames: string[];
  birthDate: Date;
  sexCode: string;
  municipalityCode: string;
  departmentCode: string;
  phoneE164: string | null;
  email: string | null;
  conforming: boolean;
  completenessPct: number;
  issuesJson: ConformanceReport['issues'] | null;
  recordHash: string;
  confirmedAt: Date | null;
  retentionMode: IdentityRetentionMode;
};

export type BuildPatientIdentityArgs = {
  scope: IdentityScope;
  identity: ConformingIdentity;
  report: ConformanceReport;
  /** Por defecto TRANSIENT: se guarda el minimo indispensable bajo Ley 1581. */
  retentionMode?: IdentityRetentionMode;
  /** Momento en que el paciente confirmo releyendo. Sin confirmacion no hay SLA. */
  confirmedAt?: Date | null;
};

function normalizeEmail(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Mapea identidad certificada -> fila de `PatientIdentity`. Funcion pura.
 *
 * Reglas duras:
 *  - NO persiste una identidad no conforme: eso seria almacenar el problema.
 *  - El hash se calcula sobre el payload canonico, no sobre lo que se muestra.
 *  - `confirmedAt` solo se escribe si el paciente realmente confirmo.
 */
export function buildPatientIdentityData(args: BuildPatientIdentityArgs): PatientIdentityData {
  const { scope, identity, report } = args;

  if (!scope.organizationId) {
    throw new Error('Falta organizationId: nunca se persiste identidad sin scope de organizacion.');
  }
  if (!report.conforming) {
    throw new Error(
      'No se persiste una identidad no conforme. Reintente la captura guiada hasta que el reporte sea conforme.'
    );
  }

  // Se normaliza PRIMERO y se calcula el hash sobre el registro normalizado.
  // Si se hasheara el input crudo, un telefono con espacios o un nombre con
  // doble espacio producirian un hash que nunca podria verificarse contra la
  // fila guardada: la evidencia de integridad nace invalida.
  const record: HashableIdentity = {
    documentType: identity.documentType,
    documentNumber: identity.documentNumber.trim().toUpperCase(),
    givenNames: identity.givenNames.map((n) => n.trim().replace(/\s+/g, ' ')),
    familyNames: identity.familyNames.map((n) => n.trim().replace(/\s+/g, ' ')),
    birthDate: identity.birthDate,
    sexCode: identity.sexCode,
    municipalityCode: identity.municipalityCode,
    departmentCode: identity.departmentCode,
    phoneE164: normalizePhoneE164(identity.phoneE164),
    email: normalizeEmail(identity.email),
  };

  return {
    organizationId: scope.organizationId,
    clinicId: scope.clinicId ?? null,
    documentType: record.documentType,
    documentNumber: record.documentNumber,
    // Nombres tal como se capturaron (legibles, sin colapsar espacios internos),
    // porque el hash normaliza internamente y la verificacion sigue siendo estable.
    givenNames: record.givenNames,
    familyNames: record.familyNames,
    birthDate: toDateOnlyUtc(record.birthDate),
    sexCode: record.sexCode,
    municipalityCode: record.municipalityCode,
    departmentCode: record.departmentCode,
    phoneE164: record.phoneE164,
    email: record.email,
    conforming: report.conforming,
    completenessPct: report.completenessPct,
    issuesJson: report.issues.length > 0 ? report.issues : null,
    recordHash: identityRecordHash(record),
    confirmedAt: args.confirmedAt ?? null,
    retentionMode: args.retentionMode ?? 'TRANSIENT',
  };
}

/** Campos almacenados necesarios para recalcular el hash. */
export type StoredIdentityHashInput = Pick<
  PatientIdentityData,
  | 'documentType'
  | 'documentNumber'
  | 'givenNames'
  | 'familyNames'
  | 'birthDate'
  | 'sexCode'
  | 'municipalityCode'
  | 'departmentCode'
  | 'phoneE164'
  | 'email'
>;

/**
 * Verifica que una fila almacenada no se haya alterado despues de certificarla.
 * Devuelve false si el hash no coincide: es la senal de que el registro fue
 * modificado fuera del flujo de captura conforme.
 */
export function verifyIdentityRecordHash(row: StoredIdentityHashInput, expectedHash: string): boolean {
  const identity: ConformingIdentity = {
    documentType: row.documentType as ConformingIdentity['documentType'],
    documentNumber: row.documentNumber,
    givenNames: [...row.givenNames],
    familyNames: [...row.familyNames],
    birthDate: isoDateOnlyFromUtc(row.birthDate),
    ageYears: 0,
    sexCode: row.sexCode as ConformingIdentity['sexCode'],
    municipalityCode: row.municipalityCode,
    departmentCode: row.departmentCode,
    departmentName: '',
    phoneE164: row.phoneE164,
    email: row.email,
  };
  return identityRecordHash(identity) === expectedHash;
}