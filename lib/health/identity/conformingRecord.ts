/**
 * Registro de identidad conforme (Upway Health) — nucleo del producto.
 *
 * Separa dos capas que NUNCA se mezclan:
 *
 *   CAPA 1 - ENTENDIMIENTO (probabilistica, IA)
 *     Produce intencion. PROHIBIDO escribir directo a un campo conforme.
 *
 *   CAPA 2 - CERTIFICACION (determinista, este modulo)
 *     Produce el dato que se entrega al HIS del cliente.
 *     Auditable, reproducible, testeable.
 *
 * Upway NO transmite el RDA ni el RIPS: eso es del prestador.
 * Upway certifica que la identidad y la demografia lleguen conformes,
 * confirmadas por el paciente y con trazabilidad.
 *
 * Base normativa: Resolucion 866 de 2021 (datos minimos IHCE),
 * DIVIPOLA (DANE), Resolucion 1888 de 2025 (RDA).
 */

import {
  validateDocument,
  validateNames,
  validateBirthDate,
  validateMunicipalityCode,
  isValidSexCode,
  type DocumentTypeCode,
  type SexCode,
} from './catalogs';

/** Campos de identidad que Upway certifica. No incluye ningun dato clinico. */
export type ConformingIdentityInput = {
  documentType: string | null | undefined;
  documentNumber: string | null | undefined;
  givenNames: readonly string[] | null | undefined;
  familyNames: readonly string[] | null | undefined;
  birthDay: number | null | undefined;
  birthMonth: number | null | undefined;
  birthYear: number | null | undefined;
  sexCode: string | null | undefined;
  municipalityCode: string | null | undefined;
  /** Telefono en formato E.164. No es campo del RDA, es la clave de contacto. */
  phoneE164?: string | null;
  email?: string | null;
};

export type ConformingIdentity = {
  documentType: DocumentTypeCode;
  documentNumber: string;
  givenNames: string[];
  familyNames: string[];
  birthDate: string;
  ageYears: number;
  sexCode: SexCode;
  municipalityCode: string;
  departmentCode: string;
  departmentName: string;
  phoneE164: string | null;
  email: string | null;
};

export type IdentityIssue = {
  field:
    | 'documentType'
    | 'documentNumber'
    | 'givenNames'
    | 'familyNames'
    | 'birthDate'
    | 'sexCode'
    | 'municipalityCode';
  message: string;
};

export type ConformanceReport = {
  /** true solo si TODOS los campos certificables pasaron validacion determinista. */
  conforming: boolean;
  /** 0-100 sobre los campos certificables exigidos. */
  completenessPct: number;
  issues: IdentityIssue[];
  /** Campos que el paciente debe confirmar releyendo antes de usar el dato. */
  requiresPatientConfirmation: boolean;
  /** Campos que nunca deben provenir de transcripcion libre (para el agente). */
  neverFromTranscription: string[];
  checkedAt: string;
};

export type ConformingIdentityResult =
  | { ok: true; identity: ConformingIdentity; report: ConformanceReport }
  | { ok: false; report: ConformanceReport };

const REQUIRED_FIELDS = 7;

/**
 * Campos que jamas pueden llenarse desde la transcripcion del agente.
 * El agente debe pedirlos por captura guiada (catalogo cerrado o digito a
 * digito + relectura de confirmacion).
 */
export const NEVER_FROM_TRANSCRIPTION: readonly string[] = [
  'documentType',
  'documentNumber',
  'birthDate',
  'municipalityCode',
];

/**
 * Valida y certifica un registro de identidad.
 * Determinista: no llama a ningun modelo ni a ninguna fuente externa.
 */
export function buildConformingIdentity(
  input: ConformingIdentityInput,
  now: Date = new Date()
): ConformingIdentityResult {
  const issues: IdentityIssue[] = [];

  // 1. Tipo + numero de documento
  const doc = validateDocument(input.documentType, input.documentNumber);
  if (!doc.valid) {
    issues.push({
      field: doc.reason === 'UNKNOWN_TYPE' ? 'documentType' : 'documentNumber',
      message: doc.message,
    });
  }

  // 2. Nombres separados (el MPI cruza por nombres exactos)
  const names = validateNames(input.givenNames, input.familyNames);
  if (!names.valid) {
    issues.push({
      field: input.givenNames && input.givenNames.length > 0 ? 'familyNames' : 'givenNames',
      message: names.message,
    });
  }

  // 3. Fecha de nacimiento por componentes
  const birth = validateBirthDate(input.birthDay, input.birthMonth, input.birthYear, now);
  if (!birth.valid) {
    issues.push({ field: 'birthDate', message: birth.message });
  }

  // 4. Sexo - pregunta explicita, nunca inferido
  const sexRaw = input.sexCode;
  if (!isValidSexCode(sexRaw)) {
    issues.push({
      field: 'sexCode',
      message: 'Falta el sexo. Debe ser pregunta explicita con opciones cerradas, nunca inferido del audio.',
    });
  }

  // 5. Municipio DIVIPOLA
  const municipality = validateMunicipalityCode(input.municipalityCode);
  if (!municipality.valid) {
    issues.push({ field: 'municipalityCode', message: municipality.message });
  }

  // El documento cuenta como un solo campo certificable aunque tenga tipo + numero.
  const failedGroups = new Set(
    issues.map((i) => (i.field === 'documentType' || i.field === 'documentNumber' ? 'document' : i.field))
  );
  const completenessPct = Math.round(((REQUIRED_FIELDS - failedGroups.size) / REQUIRED_FIELDS) * 100);

  const report: ConformanceReport = {
    conforming: issues.length === 0,
    completenessPct,
    issues,
    // Los identificadores siempre se confirman releyendo: es la unica defensa
    // real contra el error de captura de voz.
    requiresPatientConfirmation: true,
    neverFromTranscription: [...NEVER_FROM_TRANSCRIPTION],
    checkedAt: now.toISOString(),
  };

  // Guardia combinada: ademas de cortar cuando hay problemas, permite a
  // TypeScript estrechar las uniones discriminadas de cada validador.
  if (
    issues.length > 0 ||
    !doc.valid ||
    !names.valid ||
    !birth.valid ||
    !municipality.valid ||
    !isValidSexCode(sexRaw)
  ) {
    return { ok: false, report };
  }

  // validateDocument ya confirmo que documentType pertenece al catalogo cerrado.
  const documentType = String(input.documentType).trim().toUpperCase() as DocumentTypeCode;

  return {
    ok: true,
    report,
    identity: {
      documentType,
      documentNumber: doc.normalized,
      givenNames: names.givenNames,
      familyNames: names.familyNames,
      birthDate: birth.iso,
      ageYears: birth.ageYears,
      sexCode: sexRaw,
      municipalityCode: municipality.code,
      departmentCode: municipality.departmentCode,
      departmentName: municipality.departmentName,
      phoneE164: input.phoneE164 ?? null,
      email: input.email ?? null,
    },
  };
}

/**
 * Guion de confirmacion para que el agente lo lea en voz alta y el paciente
 * valide. Separar nombres y apellidos aqui es intencional: el paciente debe
 * escuchar y confirmar cada componente antes de que el dato se use.
 */
export function identityConfirmationScript(identity: ConformingIdentity): string {
  const given = identity.givenNames.join(' ');
  const family = identity.familyNames.join(' ');
  const spelled = identity.documentNumber.split('').join(' ');
  return [
    `Nombre: ${given}.`,
    `Apellidos: ${family}.`,
    `Documento: ${identity.documentType} ${spelled}.`,
    `Fecha de nacimiento: ${identity.birthDate}.`,
    `Municipio: ${identity.departmentName}, codigo ${identity.municipalityCode}.`,
    'Por favor confirme si esta correcto.',
  ].join(' ');
}