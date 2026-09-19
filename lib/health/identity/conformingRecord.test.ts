import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_RULES,
  SEX_OPTIONS,
  DEPARTMENTS,
  getDocumentRule,
  isValidDocumentTypeCode,
  isValidSexCode,
  normalizeDocumentNumber,
  validateDocument,
  validateNames,
  normalizeNamePart,
  validateBirthDate,
  validateMunicipalityCode,
  getDepartment,
} from './catalogs';
import {
  buildConformingIdentity,
  identityConfirmationScript,
  NEVER_FROM_TRANSCRIPTION,
} from './conformingRecord';

const NOW = new Date('2026-09-19T12:00:00.000Z');

const VALID_INPUT = {
  documentType: 'CC',
  documentNumber: '15802345',
  givenNames: ['Juan', 'Carlos'],
  familyNames: ['Perez', 'Gomez'],
  birthDay: 7,
  birthMonth: 8,
  birthYear: 1971,
  sexCode: 'M',
  municipalityCode: '11001',
} as const;

describe('catalogs — tipo de documento (Res. 866/2021)', () => {
  it('expone un catalogo cerrado sin duplicados', () => {
    const codes = DOCUMENT_RULES.map((r) => r.code);
    expect(codes.length).toBeGreaterThanOrEqual(13);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('solo reconoce codigos del catalogo, nunca texto libre', () => {
    expect(isValidDocumentTypeCode('CC')).toBe(true);
    expect(isValidDocumentTypeCode('cc')).toBe(true);
    expect(isValidDocumentTypeCode('cedula')).toBe(false);
    expect(isValidDocumentTypeCode('CI')).toBe(false);
    expect(isValidDocumentTypeCode(null)).toBe(false);
  });

  it('marca como asignados por la IPS los casos sin identificacion', () => {
    expect(getDocumentRule('MS')?.ipsAssigned).toBe(true);
    expect(getDocumentRule('AS')?.ipsAssigned).toBe(true);
    expect(getDocumentRule('CC')?.ipsAssigned).toBe(false);
  });
});

describe('catalogs — numero de documento', () => {
  it('normaliza puntos, espacios y guiones sin adivinar digitos', () => {
    expect(normalizeDocumentNumber('1.580.234')).toBe('1580234');
    expect(normalizeDocumentNumber(' 1 5 8 0 2 3 4 5 ')).toBe('15802345');
    expect(normalizeDocumentNumber('ab-123')).toBe('AB123');
    expect(normalizeDocumentNumber(null)).toBe('');
  });

  it('rechaza tipo desconocido sin intentar corregirlo', () => {
    const r = validateDocument('CEDULA', '15802345');
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('UNKNOWN_TYPE');
  });

  it('rechaza longitud fuera de rango', () => {
    const r = validateDocument('CC', '123');
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('BAD_LENGTH');
  });

  it('rechaza formato invalido (letras en documento numerico)', () => {
    const r = validateDocument('CC', '1580234A');
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('BAD_FORMAT');
  });

  it('acepta y normaliza una cedula valida', () => {
    const r = validateDocument('CC', '1.580.234');
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.normalized).toBe('1580234');
  });

  it('acepta alfanumericos solo donde el catalogo lo permite', () => {
    expect(validateDocument('PA', 'AB123456').valid).toBe(true);
    expect(validateDocument('PA', '123').valid).toBe(false);
  });
});

describe('catalogs — sexo', () => {
  it('exige codigo de opcion cerrada', () => {
    expect(isValidSexCode('M')).toBe(true);
    expect(isValidSexCode('f')).toBe(true);
    expect(isValidSexCode('masculino')).toBe(false);
    expect(isValidSexCode('')).toBe(false);
    expect(isValidSexCode(undefined)).toBe(false);
  });

  it('no infiere sexo: no hay opcion derivada del nombre', () => {
    const codes = SEX_OPTIONS.map((s) => s.code);
    expect(codes).toEqual(['M', 'F', 'I', 'N']);
  });
});

describe('catalogs — nombres separados (match de MPI)', () => {
  it('normaliza conservando tildes y enie', () => {
    expect(normalizeNamePart('  juan   carlos ')).toBe('Juan Carlos');
    expect(normalizeNamePart('muñoz')).toBe('Muñoz');
    expect(normalizeNamePart('o\'brien')).toBe('O\'Brien');
  });

  it('exige al menos un nombre y un apellido por separado', () => {
    expect(validateNames(['Juan'], ['Perez']).valid).toBe(true);
    expect(validateNames([], ['Perez']).valid).toBe(false);
    expect(validateNames(['Juan'], []).valid).toBe(false);
    expect(validateNames(null, null).valid).toBe(false);
  });

  it('devuelve arreglos separados, no un campo unico', () => {
    const r = validateNames(['juan', 'carlos'], ['perez', 'gomez']);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.givenNames).toEqual(['Juan', 'Carlos']);
      expect(r.familyNames).toEqual(['Perez', 'Gomez']);
    }
  });

  it('rechaza componentes demasiado cortos', () => {
    expect(validateNames(['J'], ['Perez']).valid).toBe(false);
  });
});

describe('catalogs — fecha de nacimiento por componentes', () => {
  it('rechaza prosa o componentes faltantes', () => {
    expect(validateBirthDate(null, 8, 1971, NOW).valid).toBe(false);
    expect(validateBirthDate(7, null, 1971, NOW).valid).toBe(false);
    expect(validateBirthDate(7, 8, null, NOW).valid).toBe(false);
  });

  it('valida dias reales del mes', () => {
    expect(validateBirthDate(31, 2, 1990, NOW).valid).toBe(false);
    expect(validateBirthDate(29, 2, 2024, NOW).valid).toBe(true);
    expect(validateBirthDate(29, 2, 2023, NOW).valid).toBe(false);
  });

  it('rechaza fechas futuras y anios fuera de rango', () => {
    expect(validateBirthDate(1, 1, 2030, NOW).valid).toBe(false);
    expect(validateBirthDate(1, 1, 1850, NOW).valid).toBe(false);
  });

  it('calcula edad y fecha ISO', () => {
    const r = validateBirthDate(7, 8, 1971, NOW);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.iso).toBe('1971-08-07');
      expect(r.ageYears).toBe(55);
    }
  });

  it('ajusta la edad cuando el cumpleanios aun no ha pasado', () => {
    const r = validateBirthDate(25, 12, 1971, NOW);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.ageYears).toBe(54);
  });
});

describe('catalogs — DIVIPOLA', () => {
  it('mantiene los 33 codigos de departamento', () => {
    expect(DEPARTMENTS.length).toBe(33);
    expect(getDepartment('11')?.name).toBe('Bogota D.C.');
    expect(getDepartment('76')?.name).toBe('Valle del Cauca');
    expect(getDepartment('00')).toBeNull();
  });

  it('exige 5 digitos y coherencia departamental', () => {
    expect(validateMunicipalityCode('11001').valid).toBe(true);
    expect(validateMunicipalityCode('1100').valid).toBe(false);
    expect(validateMunicipalityCode('00000').valid).toBe(false);
    expect(validateMunicipalityCode(null).valid).toBe(false);
  });

  it('rechaza el codigo de departamento disfrazado de municipio', () => {
    const r = validateMunicipalityCode('11000');
    expect(r.valid).toBe(false);
  });

  it('devuelve el departamento resuelto', () => {
    const r = validateMunicipalityCode('76001');
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.departmentCode).toBe('76');
      expect(r.departmentName).toBe('Valle del Cauca');
    }
  });
});

describe('buildConformingIdentity — registro conforme', () => {
  it('certifica un registro completo', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT }, NOW);
    expect(r.ok).toBe(true);
    expect(r.report.conforming).toBe(true);
    expect(r.report.completenessPct).toBe(100);
    expect(r.report.issues).toEqual([]);
    if (r.ok) {
      expect(r.identity.documentType).toBe('CC');
      expect(r.identity.documentNumber).toBe('15802345');
      expect(r.identity.givenNames).toEqual(['Juan', 'Carlos']);
      expect(r.identity.familyNames).toEqual(['Perez', 'Gomez']);
      expect(r.identity.birthDate).toBe('1971-08-07');
      expect(r.identity.sexCode).toBe('M');
      expect(r.identity.municipalityCode).toBe('11001');
      expect(r.identity.departmentName).toBe('Bogota D.C.');
    }
  });

  it('exige identidad separada: un solo campo de nombre no puede pasar', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, givenNames: [], familyNames: [] }, NOW);
    expect(r.ok).toBe(false);
    expect(r.report.conforming).toBe(false);
    expect(r.report.issues.some((i) => i.field === 'givenNames')).toBe(true);
  });

  it('exige tipo de documento: numero sin tipo no certifica', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, documentType: null }, NOW);
    expect(r.ok).toBe(false);
    expect(r.report.issues.some((i) => i.field === 'documentType')).toBe(true);
  });

  it('exige sexo explicito y nunca lo infiere', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, sexCode: undefined }, NOW);
    expect(r.ok).toBe(false);
    expect(r.report.issues.some((i) => i.field === 'sexCode')).toBe(true);
  });

  it('exige municipio DIVIPOLA valido', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, municipalityCode: 'Bogota' }, NOW);
    expect(r.ok).toBe(false);
    expect(r.report.issues.some((i) => i.field === 'municipalityCode')).toBe(true);
  });

  it('exige fecha de nacimiento por componentes, no prosa', () => {
    const r = buildConformingIdentity(
      { ...VALID_INPUT, birthDay: null, birthMonth: null, birthYear: null },
      NOW
    );
    expect(r.ok).toBe(false);
    expect(r.report.issues.some((i) => i.field === 'birthDate')).toBe(true);
  });

  it('calcula completitud agrupando tipo + numero como un solo campo', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, documentType: 'CEDULA' }, NOW);
    expect(r.report.completenessPct).toBe(86);
    expect(r.report.issues.filter((i) => i.field === 'documentType').length).toBe(1);
  });

  it('siempre exige confirmacion del paciente', () => {
    const ok = buildConformingIdentity({ ...VALID_INPUT }, NOW);
    const fail = buildConformingIdentity({ ...VALID_INPUT, sexCode: null }, NOW);
    expect(ok.report.requiresPatientConfirmation).toBe(true);
    expect(fail.report.requiresPatientConfirmation).toBe(true);
  });

  it('prohibe que los identificadores vengan de transcripcion libre', () => {
    expect(NEVER_FROM_TRANSCRIPTION).toContain('documentNumber');
    expect(NEVER_FROM_TRANSCRIPTION).toContain('documentType');
    expect(NEVER_FROM_TRANSCRIPTION).toContain('birthDate');
    expect(NEVER_FROM_TRANSCRIPTION).toContain('municipalityCode');
    // El nombre SI puede venir de transcripcion, pero debe confirmarse.
    expect(NEVER_FROM_TRANSCRIPTION).not.toContain('givenNames');
  });

  it('no incluye ningun campo clinico en el registro certificado', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT }, NOW);
    if (r.ok) {
      const keys = Object.keys(r.identity);
      for (const forbidden of ['diagnosis', 'cie10', 'cups', 'prescription', 'ium', 'notes']) {
        expect(keys).not.toContain(forbidden);
      }
    }
  });

  it('normaliza el documento antes de certificar', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT, documentNumber: '1.580.234' }, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.identity.documentNumber).toBe('1580234');
  });
});

describe('identityConfirmationScript — confirmacion del paciente', () => {
  it('deletrea el documento y separa nombre de apellidos', () => {
    const r = buildConformingIdentity({ ...VALID_INPUT }, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const script = identityConfirmationScript(r.identity);
      expect(script).toContain('Nombre: Juan Carlos');
      expect(script).toContain('Apellidos: Perez Gomez');
      expect(script).toContain('1 5 8 0 2 3 4 5');
      expect(script).toContain('1971-08-07');
      expect(script).toContain('confirme');
    }
  });
});