/**
 * Catalogos oficiales para captura de identidad conforme (Upway Health).
 *
 * REGLA DE ORO (ver REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md):
 *   Nada probabilistico escribe en un campo conforme.
 *   La IA interpreta; estos catalogos deterministas certifican.
 *   Un campo cerrado siempre vence a un campo abierto.
 *
 * Fuente normativa:
 * - Resolucion 866 de 2021 (MinSalud) - codificacion del conjunto de datos
 *   minimos de la IHCE: tipo de documento, sexo y municipio.
 * - DANE - DIVIPOLA: departamento = 2 digitos, municipio = 3 digitos.
 *
 * IMPORTANTE: los codigos de tipo de documento y sexo deben contrastarse contra
 * el Anexo Tecnico vigente publicado en el micrositio SISPRO antes de pasar a
 * produccion. Este modulo NO transmite nada a la IHCE: Upway certifica el dato
 * de entrada, el prestador transmite el RDA.
 */

/** Tipo de documento de identificacion - catalogo cerrado, nunca texto libre. */
export type DocumentTypeCode =
  | 'CC' // Cedula de ciudadania
  | 'CE' // Cedula de extranjeria
  | 'TI' // Tarjeta de identidad
  | 'RC' // Registro civil
  | 'NU' // NUIP - Numero unico de identificacion personal
  | 'PA' // Pasaporte
  | 'CD' // Carne diplomatico
  | 'SC' // Salvoconducto
  | 'PE' // Permiso especial de permanencia
  | 'PT' // Permiso por proteccion temporal
  | 'DE' // Documento extranjero
  | 'MS' // Menor sin identificacion (asignado por la IPS)
  | 'AS'; // Adulto sin identificacion (asignado por la IPS)

export type DocumentRule = {
  code: DocumentTypeCode;
  label: string;
  /** Patron sobre el numero ya normalizado (sin puntos, espacios ni guiones). */
  pattern: RegExp;
  minLength: number;
  maxLength: number;
  /**
   * true si el documento lo asigna la propia IPS y no proviene del ciudadano.
   * Estos casos son legitimos y no deben bloquear la atencion.
   */
  ipsAssigned: boolean;
  /** Mensaje de guia para el agente de voz/WhatsApp. */
  hint: string;
};

export const DOCUMENT_RULES: readonly DocumentRule[] = [
  {
    code: 'CC',
    label: 'Cedula de ciudadania',
    pattern: /^\d{6,10}$/,
    minLength: 6,
    maxLength: 10,
    ipsAssigned: false,
    hint: 'Pida la cedula digito a digito y repita el numero completo para confirmar.',
  },
  {
    code: 'CE',
    label: 'Cedula de extranjeria',
    pattern: /^\d{6,12}$/,
    minLength: 6,
    maxLength: 12,
    ipsAssigned: false,
    hint: 'Pida la cedula de extranjeria digito a digito y confirme la relectura.',
  },
  {
    code: 'TI',
    label: 'Tarjeta de identidad',
    pattern: /^\d{8,11}$/,
    minLength: 8,
    maxLength: 11,
    ipsAssigned: false,
    hint: 'Tarjeta de identidad de menor de edad. Confirme el numero dos veces.',
  },
  {
    code: 'RC',
    label: 'Registro civil',
    pattern: /^\d{8,12}$/,
    minLength: 8,
    maxLength: 12,
    ipsAssigned: false,
    hint: 'Registro civil. Si el acudiente no lo tiene a mano, ofrezca MS.',
  },
  {
    code: 'NU',
    label: 'NUIP',
    pattern: /^\d{8,12}$/,
    minLength: 8,
    maxLength: 12,
    ipsAssigned: false,
    hint: 'NUIP impreso en el registro civil. Confirme digito a digito.',
  },
  {
    code: 'PA',
    label: 'Pasaporte',
    pattern: /^[A-Z0-9]{5,12}$/,
    minLength: 5,
    maxLength: 12,
    ipsAssigned: false,
    hint: 'Deletree las letras y confirme el numero completo.',
  },
  {
    code: 'CD',
    label: 'Carne diplomatico',
    pattern: /^[A-Z0-9]{4,12}$/,
    minLength: 4,
    maxLength: 12,
    ipsAssigned: false,
    hint: 'Deletree el carne y confirme la relectura.',
  },
  {
    code: 'SC',
    label: 'Salvoconducto',
    pattern: /^[A-Z0-9]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: false,
    hint: 'Deletree el salvoconducto y confirme la relectura.',
  },
  {
    code: 'PE',
    label: 'Permiso especial de permanencia',
    pattern: /^[A-Z0-9]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: false,
    hint: 'Deletree el permiso y confirme la relectura.',
  },
  {
    code: 'PT',
    label: 'Permiso por proteccion temporal',
    pattern: /^[A-Z0-9]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: false,
    hint: 'Deletree el permiso y confirme la relectura.',
  },
  {
    code: 'DE',
    label: 'Documento extranjero',
    pattern: /^[A-Z0-9]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: false,
    hint: 'Documento del pais de origen. Deletree y confirme.',
  },
  {
    code: 'MS',
    label: 'Menor sin identificacion',
    pattern: /^[A-Z0-9-]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: true,
    hint: 'Lo asigna la IPS cuando el menor no tiene documento. Nunca bloquea la atencion.',
  },
  {
    code: 'AS',
    label: 'Adulto sin identificacion',
    pattern: /^[A-Z0-9-]{4,20}$/,
    minLength: 4,
    maxLength: 20,
    ipsAssigned: true,
    hint: 'Lo asigna la IPS para atencion urgente. Nunca bloquea la atencion.',
  },
];

const DOCUMENT_RULE_BY_CODE = new Map<string, DocumentRule>(
  DOCUMENT_RULES.map((rule) => [rule.code, rule])
);

export function getDocumentRule(code: string | null | undefined): DocumentRule | null {
  if (!code) return null;
  return DOCUMENT_RULE_BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

export function isValidDocumentTypeCode(code: string | null | undefined): code is DocumentTypeCode {
  return getDocumentRule(code) !== null;
}

/**
 * Normaliza un numero de documento dictado o escrito.
 * Elimina puntos, espacios y guiones; sube a mayusculas los alfanumericos.
 * NO corrige ni adivina digitos: eso es trabajo del paciente al confirmar.
 */
export function normalizeDocumentNumber(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[\s.\-_]/g, '').toUpperCase();
}

export type DocumentValidation =
  | { valid: true; normalized: string }
  | { valid: false; reason: 'UNKNOWN_TYPE' | 'EMPTY' | 'BAD_LENGTH' | 'BAD_FORMAT'; message: string };

/**
 * Valida tipo + numero de documento contra el catalogo cerrado.
 * Determinista: no usa IA y no consulta fuentes externas.
 */
export function validateDocument(
  typeCode: string | null | undefined,
  rawNumber: string | null | undefined
): DocumentValidation {
  const rule = getDocumentRule(typeCode);
  if (!rule) {
    return {
      valid: false,
      reason: 'UNKNOWN_TYPE',
      message: `Tipo de documento no reconocido. Valores validos: ${DOCUMENT_RULES.map((r) => r.code).join(', ')}.`,
    };
  }

  const normalized = normalizeDocumentNumber(rawNumber);
  if (!normalized) {
    return {
      valid: false,
      reason: 'EMPTY',
      message: `Falta el numero de documento para ${rule.label}. ${rule.hint}`,
    };
  }

  if (normalized.length < rule.minLength || normalized.length > rule.maxLength) {
    return {
      valid: false,
      reason: 'BAD_LENGTH',
      message: `${rule.label} debe tener entre ${rule.minLength} y ${rule.maxLength} caracteres y llego con ${normalized.length}. ${rule.hint}`,
    };
  }

  if (!rule.pattern.test(normalized)) {
    return {
      valid: false,
      reason: 'BAD_FORMAT',
      message: `El numero no tiene el formato de ${rule.label}. ${rule.hint}`,
    };
  }

  return { valid: true, normalized };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sexo — Resolucion 866 de 2021. Siempre pregunta explicita, nunca inferido
// del audio ni del nombre.
// ─────────────────────────────────────────────────────────────────────────────

export type SexCode = 'M' | 'F' | 'I' | 'N';

export const SEX_OPTIONS = [
  { code: 'M', label: 'Masculino' },
  { code: 'F', label: 'Femenino' },
  { code: 'I', label: 'Indeterminado / intersexual' },
  { code: 'N', label: 'No informa' },
] as const;

const SEX_CODES = new Set<string>(SEX_OPTIONS.map((s) => s.code));

export function isValidSexCode(code: string | null | undefined): code is SexCode {
  if (!code) return false;
  return SEX_CODES.has(code.trim().toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// Nombres — el MPI nacional cruza identidad por nombres exactos.
// Guardar un unico campo libre evita el match y produce rechazo del RDA.
// ─────────────────────────────────────────────────────────────────────────────

export type NameValidation =
  | { valid: true; givenNames: string[]; familyNames: string[] }
  | { valid: false; message: string };

/**
 * Normaliza un componente de nombre: colapsa espacios, recorta y capitaliza.
 * No elimina tildes ni la enie: el MPI las conserva.
 */
export function normalizeNamePart(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])([\p{L}])/gu, (_m, sep: string, chr: string) => sep + chr.toUpperCase());
}

/**
 * Limpia una lista de nombres tomada de la conversacion y exige al menos un
 * nombre y un apellido. Si el paciente tiene un solo nombre o un solo apellido
 * (caso legitimo), use forceSingle con true y deje el segundo arreglo vacio.
 */
export function normalizeNameList(values: readonly string[] | null | undefined): string[] {
  if (!values) return [];
  return values
    .map((v) => normalizeNamePart(v))
    .filter((v) => v.length > 0);
}

export function validateNames(
  givenNamesRaw: readonly string[] | null | undefined,
  familyNamesRaw: readonly string[] | null | undefined
): NameValidation {
  const givenNames = normalizeNameList(givenNamesRaw);
  const familyNames = normalizeNameList(familyNamesRaw);

  if (givenNames.length === 0) {
    return { valid: false, message: 'Falta al menos un nombre propio.' };
  }
  if (familyNames.length === 0) {
    return {
      valid: false,
      message: 'Falta al menos un apellido. Pregunte el apellido completo tal como aparece en el documento.',
    };
  }
  if (givenNames.some((n) => n.length < 2) || familyNames.some((n) => n.length < 2)) {
    return { valid: false, message: 'Nombre o apellido demasiado corto. Confirme con el paciente.' };
  }

  return { valid: true, givenNames, familyNames };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fecha de nacimiento — se captura por componentes (dia / mes / anio).
// Prohibido parsear prosa como "el 7 de agosto del 71": es ambiguo.
// ─────────────────────────────────────────────────────────────────────────────

export type BirthDateValidation =
  | { valid: true; iso: string; ageYears: number }
  | { valid: false; message: string };

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Valida fecha por componentes. No acepta texto libre ni fechas incompletas.
 * `now` es inyectable para pruebas deterministas.
 */
export function validateBirthDate(
  day: number | null | undefined,
  month: number | null | undefined,
  year: number | null | undefined,
  now: Date = new Date()
): BirthDateValidation {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { valid: false, message: 'Captura la fecha de nacimiento por componentes: dia, mes y anio.' };
  }

  const d = day as number;
  const m = month as number;
  const y = year as number;

  if (y < 1900 || y > now.getUTCFullYear()) {
    return { valid: false, message: `El anio de nacimiento debe estar entre 1900 y ${now.getUTCFullYear()}.` };
  }
  if (m < 1 || m > 12) {
    return { valid: false, message: 'El mes debe estar entre 1 y 12.' };
  }
  if (d < 1 || d > daysInMonth(y, m)) {
    return { valid: false, message: `El dia debe estar entre 1 y ${daysInMonth(y, m)} para ese mes.` };
  }

  const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const birth = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > now.getTime()) {
    return { valid: false, message: 'La fecha de nacimiento no puede estar en el futuro.' };
  }

  let ageYears = now.getUTCFullYear() - y;
  const monthDiff = now.getUTCMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < d)) {
    ageYears -= 1;
  }

  return { valid: true, iso, ageYears };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVIPOLA (DANE) — nunca se captura por dictado libre.
// Departamento = 2 digitos. Municipio = 5 digitos (2 de departamento + 3).
//
// Los 33 codigos de departamento son estables y completos aqui.
// El catalogo completo de MUNICIPIOS (1.103) debe cargarse desde el archivo
// oficial DIVIPOLA del DANE antes de produccion; este modulo solo valida la
// forma y la coherencia departamental, que ya elimina la mayoria de errores.
// ─────────────────────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  { code: '05', name: 'Antioquia' },
  { code: '08', name: 'Atlantico' },
  { code: '11', name: 'Bogota D.C.' },
  { code: '13', name: 'Bolivar' },
  { code: '15', name: 'Boyaca' },
  { code: '17', name: 'Caldas' },
  { code: '18', name: 'Caqueta' },
  { code: '19', name: 'Cauca' },
  { code: '20', name: 'Cesar' },
  { code: '23', name: 'Cordoba' },
  { code: '25', name: 'Cundinamarca' },
  { code: '27', name: 'Choco' },
  { code: '41', name: 'Huila' },
  { code: '44', name: 'La Guajira' },
  { code: '47', name: 'Magdalena' },
  { code: '50', name: 'Meta' },
  { code: '52', name: 'Narino' },
  { code: '54', name: 'Norte de Santander' },
  { code: '63', name: 'Quindio' },
  { code: '66', name: 'Risaralda' },
  { code: '68', name: 'Santander' },
  { code: '70', name: 'Sucre' },
  { code: '73', name: 'Tolima' },
  { code: '76', name: 'Valle del Cauca' },
  { code: '81', name: 'Arauca' },
  { code: '85', name: 'Casanare' },
  { code: '86', name: 'Putumayo' },
  { code: '88', name: 'Archipielago de San Andres, Providencia y Santa Catalina' },
  { code: '91', name: 'Amazonas' },
  { code: '94', name: 'Guainia' },
  { code: '95', name: 'Guaviare' },
  { code: '97', name: 'Vaupes' },
  { code: '99', name: 'Vichada' },
] as const;

export type DepartmentCode = (typeof DEPARTMENTS)[number]['code'];

export function getDepartment(code: string | null | undefined): { code: string; name: string } | null {
  if (!code) return null;
  const normalized = code.trim().padStart(2, '0');
  return DEPARTMENTS.find((d) => d.code === normalized) ?? null;
}

export type MunicipalityValidation =
  | { valid: true; code: string; departmentCode: string; departmentName: string }
  | { valid: false; message: string };

/**
 * Valida un codigo DIVIPOLA de municipio por forma y coherencia departamental.
 * No confirma que el municipio exista: para eso, cargue el catalogo DANE.
 */
export function validateMunicipalityCode(code: string | null | undefined): MunicipalityValidation {
  if (!code) {
    return { valid: false, message: 'Falta el municipio. Seleccionelo de la lista, nunca por dictado libre.' };
  }

  const normalized = code.replace(/\s/g, '');
  if (!/^\d{5}$/.test(normalized)) {
    return {
      valid: false,
      message: 'El codigo DIVIPOLA del municipio debe tener 5 digitos (2 de departamento + 3 de municipio).',
    };
  }

  const departmentCode = normalized.slice(0, 2);
  const department = getDepartment(departmentCode);
  if (!department) {
    return { valid: false, message: `El departamento ${departmentCode} no existe en DIVIPOLA.` };
  }
  if (normalized.slice(2) === '000') {
    return { valid: false, message: 'El municipio no puede terminar en 000: ese es el codigo del departamento.' };
  }

  return { valid: true, code: normalized, departmentCode, departmentName: department.name };
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 3 (identidad conforme): el tipo de documento que un servicio exige
// (requiredDocumentType) tambien es catalogo cerrado. Nunca texto libre:
// el dato que llega aqui se usara como llave de match en el RDA.
// ─────────────────────────────────────────────────────────────────────────────

export type RequiredDocumentTypeResult =
  | { ok: true; code: DocumentTypeCode | null }
  | { ok: false; message: string };

/**
 * Valida y normaliza el tipo de documento exigido por un servicio.
 * Vacio u omitido = el servicio no exige tipo (ok con code null).
 * Cualquier otro valor DEBE pertenecer al catalogo cerrado; si no, se rechaza.
 */
export function validateRequiredDocumentType(
  value: string | null | undefined
): RequiredDocumentTypeResult {
  const normalized = (value ?? '').trim().toUpperCase();
  if (!normalized) return { ok: true, code: null };
  if (isValidDocumentTypeCode(normalized)) return { ok: true, code: normalized };
  return {
    ok: false,
    message:
      `El tipo de documento "${normalized}" no pertenece al catalogo cerrado de la ` +
      'Resolucion 866 de 2021. Codigos validos: CC, CE, TI, RC, NU, PA, CD, SC, PE, PT, DE, MS, AS.',
  };
}