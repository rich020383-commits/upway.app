/**
 * Tests del catalogo cerrado — Paso 3 (identidad conforme).
 *
 * El contrato clave: el tipo de documento exigido por un servicio
 * (requiredDocumentType) NUNCA es texto libre. O pertenece al catalogo
 * cerrado de la Resolucion 866 de 2021, o se rechaza.
 */

import {
  DOCUMENT_RULES,
  validateRequiredDocumentType,
  normalizeDocumentNumber,
  isValidDocumentTypeCode,
  getDocumentRule,
  SEX_TO_ADMINISTRATIVE_GENDER,
  SEX_TO_BIOLOGICAL_GENDER_GROUP,
} from './catalogs';
import { describe, expect, it } from 'vitest';

describe('validateRequiredDocumentType (borde de la API de agenda)', () => {
  it('acepta vacio como "el servicio no exige tipo"', () => {
    expect(validateRequiredDocumentType(null)).toEqual({ ok: true, code: null });
    expect(validateRequiredDocumentType(undefined)).toEqual({ ok: true, code: null });
    expect(validateRequiredDocumentType('')).toEqual({ ok: true, code: null });
    expect(validateRequiredDocumentType('   ')).toEqual({ ok: true, code: null });
  });

  it('acepta codigos del catalogo cerrado y los normaliza', () => {
    expect(validateRequiredDocumentType('CC')).toEqual({ ok: true, code: 'CC' });
    // Minusculas y espacios sobrantes se normalizan: es determinista.
    expect(validateRequiredDocumentType('  cc ')).toEqual({ ok: true, code: 'CC' });
    expect(validateRequiredDocumentType('pa')).toEqual({ ok: true, code: 'PA' });
  });

  it('rechaza texto libre: la llave del RDA no se inventa', () => {
    const cedula = validateRequiredDocumentType('CEDULA');
    expect(cedula.ok).toBe(false);
    if (!cedula.ok) {
      expect(cedula.message).toContain('catalogo cerrado');
      expect(cedula.message).toContain('Resolucion 866');
    }

    const libre = validateRequiredDocumentType('cedula de ciudadania');
    expect(libre.ok).toBe(false);
  });

  it('el mensaje de rechazo lista TODO el catalogo vigente (ValueSet RDA)', () => {
    const result = validateRequiredDocumentType('DNI');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const code of [
        'CC', 'CE', 'TI', 'RC', 'CN', 'PA', 'CD', 'DE', 'SC', 'PE',
        'PT', 'PPT', 'PC', 'RUT', 'SI', 'MS', 'AS',
      ]) {
        expect(result.message).toContain(code);
      }
      // NU no existe en la ValueSet: nunca debe aparecer como valido.
      expect(result.message).not.toContain('NU');
    }
  });
});

describe('normalizeDocumentNumber (normalizacion determinista del dictado)', () => {
  it('quita espacios, puntos y guiones del dictado por voz', () => {
    expect(normalizeDocumentNumber('1.020.334.567')).toBe('1020334567');
    expect(normalizeDocumentNumber('1 020 334 567')).toBe('1020334567');
    expect(normalizeDocumentNumber('AB-123-456')).toBe('AB123456');
  });

  it('sube a mayusculas los alfanumericos (pasaporte)', () => {
    expect(normalizeDocumentNumber('ab123456')).toBe('AB123456');
  });

  it('NO corrige ni adivina: vacio sigue vacio', () => {
    expect(normalizeDocumentNumber(null)).toBe('');
    expect(normalizeDocumentNumber(undefined)).toBe('');
    expect(normalizeDocumentNumber('   ')).toBe('');
  });
});

describe('isValidDocumentTypeCode / getDocumentRule (guardas del catalogo)', () => {
  it('acepta solo los codigos del catalogo cerrado', () => {
    expect(isValidDocumentTypeCode('CC')).toBe(true);
    expect(isValidDocumentTypeCode('AS')).toBe(true);
    expect(isValidDocumentTypeCode('DE')).toBe(true); // Documento Extranjero
    expect(isValidDocumentTypeCode('PC')).toBe(true); // PEP-TUTOR
    expect(isValidDocumentTypeCode('SI')).toBe(true); // Sin identificacion
    expect(isValidDocumentTypeCode('RUT')).toBe(true);
    expect(isValidDocumentTypeCode('PPT')).toBe(true);
    expect(isValidDocumentTypeCode('CN')).toBe(true);
    expect(isValidDocumentTypeCode('NU')).toBe(false); // retirado: no esta en la ValueSet
    expect(isValidDocumentTypeCode('DNI')).toBe(false);
    expect(isValidDocumentTypeCode('')).toBe(false);
    expect(isValidDocumentTypeCode(null)).toBe(false);
  });

  it('getDocumentRule devuelve la regla con su guia para el agente de voz', () => {
    const cc = getDocumentRule('cc'); // insensitive a mayusculas
    expect(cc?.code).toBe('CC');
    expect(cc?.hint.length).toBeGreaterThan(0);
    expect(getDocumentRule('XX')).toBeNull();
  });
});

describe('catalogo de documento — ValueSet oficial RDA (17 codigos)', () => {
  const OFFICIAL = [
    'CC', 'CE', 'TI', 'RC', 'CN', 'PA', 'CD', 'DE', 'SC', 'PE',
    'PT', 'PPT', 'PC', 'RUT', 'SI', 'MS', 'AS',
  ];

  it('cubre exactamente los codigos de ColombianPersonIdentifierCodes', () => {
    const codes = DOCUMENT_RULES.map((r) => r.code).sort();
    expect(codes).toEqual([...OFFICIAL].sort());
  });

  it('incluye DE (Documento Extranjero) y PC (PEP-TUTOR), antes ausentes', () => {
    expect(isValidDocumentTypeCode('DE')).toBe(true);
    expect(isValidDocumentTypeCode('PC')).toBe(true);
  });

  it('SI es "Sin identificacion" (no el provisional "codigo SI")', () => {
    expect(getDocumentRule('SI')?.label).toBe('Sin identificacion');
  });
});

describe('sexo — mapeo a los code systems del RDA', () => {
  it('M/F/I/N mapean 1 a 1 a AdministrativeGender', () => {
    expect(SEX_TO_ADMINISTRATIVE_GENDER).toEqual({
      M: 'male',
      F: 'female',
      I: 'other',
      N: 'unknown',
    });
  });

  it('M/F/I mapean al genero biologico colombiano (01/02/03)', () => {
    expect(SEX_TO_BIOLOGICAL_GENDER_GROUP.M).toEqual({ code: '01', display: 'Hombre' });
    expect(SEX_TO_BIOLOGICAL_GENDER_GROUP.F).toEqual({ code: '02', display: 'Mujer' });
    expect(SEX_TO_BIOLOGICAL_GENDER_GROUP.I).toEqual({
      code: '03',
      display: 'Indeterminado o Intersexual',
    });
  });
});
