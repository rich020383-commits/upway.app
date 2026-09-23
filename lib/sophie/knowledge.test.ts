import { describe, expect, it } from 'vitest';
import { FORBIDDEN_COST_PATTERNS, KNOWLEDGE } from './knowledge';
import { formatCOP } from '@/lib/health/plans-enterprise';
import { IDENTITY_MODULE_COP, IVA_RATE } from '@/lib/health/plans';
import { OVERAGE_COP } from '@/lib/pricing/rules';

describe('corpus de conocimiento de Sophie', () => {
  it('chunks con id único y campos completos', () => {
    const ids = KNOWLEDGE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const chunk of KNOWLEDGE) {
      expect(chunk.title.length).toBeGreaterThan(0);
      expect(chunk.content.length).toBeGreaterThan(0);
      expect(chunk.source.length).toBeGreaterThan(0);
      expect(chunk.tags.length).toBeGreaterThan(0);
    }
  });

  it('incluye los precios generados desde el código canónico', () => {
    const serialized = JSON.stringify(KNOWLEDGE);
    expect(serialized).toContain(formatCOP(429000)); // Health: Consultorio 600
    expect(serialized).toContain(formatCOP(1199000)); // Health: Clínica Pro 1.800
    expect(serialized).toContain(formatCOP(14490000)); // Health: IPS Enterprise
    expect(serialized).toContain(formatCOP(399000)); // Inmobiliaria: Starter
    expect(serialized).toContain(formatCOP(699000)); // Center: Línea
    expect(serialized).toContain(formatCOP(IDENTITY_MODULE_COP)); // Módulo identidad
    // El minuto adicional aparece como precio público en el corpus.
    expect(serialized).toContain(`${formatCOP(OVERAGE_COP)}/min`);
    expect(IVA_RATE).toBe(0.19);
  });

  it('NUNCA filtra costos de proveedores, márgenes ni TRM al corpus', () => {
    const serialized = JSON.stringify(KNOWLEDGE);
    for (const pattern of FORBIDDEN_COST_PATTERNS) {
      expect(pattern.test(serialized), `el corpus viola ${pattern}`).toBe(false);
    }
  });
});
