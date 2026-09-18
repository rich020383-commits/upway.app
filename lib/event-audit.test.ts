import { describe, expect, it, vi } from 'vitest';

// El módulo importa la instancia compartida de Prisma; se sustituye para poder
// probar el saneador de auditoría sin tocar la base de datos.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import { AUDIT_LIMITS, sanitizeForAudit } from './event-audit';

describe('sanitizeForAudit', () => {
  it('deja pasar valores simples sin cambios', () => {
    expect(sanitizeForAudit('hola')).toBe('hola');
    expect(sanitizeForAudit(42)).toBe(42);
    expect(sanitizeForAudit(true)).toBe(true);
    expect(sanitizeForAudit(null)).toBeNull();
    expect(sanitizeForAudit(undefined)).toBeNull();
  });

  it('convierte fechas a ISO y bigints a texto', () => {
    const fecha = new Date('2026-01-02T03:04:05.000Z');
    expect(sanitizeForAudit(fecha)).toBe('2026-01-02T03:04:05.000Z');
    expect(sanitizeForAudit(BigInt(7))).toBe('7');
  });

  it('trunca strings que superan el máximo', () => {
    const largo = 'x'.repeat(AUDIT_LIMITS.maxStringLength + 500);
    const resultado = sanitizeForAudit(largo) as string;

    expect(resultado.startsWith('x'.repeat(100))).toBe(true);
    expect(resultado.length).toBeLessThan(largo.length);
    expect(resultado).toContain('...[+500]');
  });

  it('limita la cantidad de elementos de un arreglo', () => {
    const arreglo = Array.from({ length: AUDIT_LIMITS.maxArrayLength + 12 }, (_, i) => i);
    const resultado = sanitizeForAudit(arreglo) as unknown[];

    expect(resultado).toHaveLength(AUDIT_LIMITS.maxArrayLength + 1);
    expect(resultado[resultado.length - 1]).toBe('...[+12]');
  });

  it('corta la profundidad excesiva', () => {
    let anidado: Record<string, unknown> = { fin: true };
    for (let i = 0; i < AUDIT_LIMITS.maxDepth + 5; i += 1) {
      anidado = { nivel: anidado };
    }

    const serializado = JSON.stringify(sanitizeForAudit(anidado));
    expect(serializado.length).toBeLessThan(200);
    expect(serializado).toContain('[objeto]');
  });

  it('no se cuelga con referencias circulares y devuelve un resumen', () => {
    const circular: Record<string, unknown> = { nombre: 'raiz' };
    circular.yo = circular;

    let resultado: unknown;
    expect(() => {
      resultado = sanitizeForAudit(circular);
    }).not.toThrow();

    expect(resultado).toBeDefined();
    expect(JSON.stringify(resultado)).toBeDefined();
  });

  it('devuelve un resumen recortado cuando el total excede el tope global', () => {
    // Muchas claves con strings medianos: supera maxTotalChars sin disparar
    // los topes individuales.
    const grande: Record<string, string> = {};
    for (let i = 0; i < AUDIT_LIMITS.maxKeys; i += 1) {
      grande['clave_' + i] = 'v'.repeat(AUDIT_LIMITS.maxStringLength);
    }

    const resultado = sanitizeForAudit(grande) as {
      truncated?: boolean;
      originalChars?: number;
      preview?: string;
    };

    expect(resultado.truncated).toBe(true);
    expect(resultado.preview?.length).toBe(AUDIT_LIMITS.maxTotalChars);
    expect(resultado.originalChars).toBeGreaterThan(AUDIT_LIMITS.maxTotalChars);
  });

  it('preserva la estructura de un payload de webhook típico', () => {
    const webhook = {
      event_type: 'message.received',
      data: {
        id: 'abc',
        from: '+573001112233',
        text: 'Hola',
        nested: { deep: { deeper: 'ok' } },
      },
    };

    expect(sanitizeForAudit(webhook)).toEqual(webhook);
  });
});
