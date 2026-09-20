/**
 * Tests del catalogo cerrado — Paso 3 (identidad conforme).
 *
 * El contrato clave: el tipo de documento exigido por un servicio
 * (requiredDocumentType) NUNCA es texto libre. O pertenece al catalogo
 * cerrado de la Resolucion 866 de 2021, o se rechaza.
 */

import {
  validateRequiredDocumentType,
  normalizeDocumentNumber,
  isValidDocumentTypeCode,
  getDocumentRule,
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

  it('el mensaje de rechazo lista los codigos validos para guiar al panel', () => {
    const result = validateRequiredDocumentType('DNI');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('CC');
      expect(result.message).toContain('PA');
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
