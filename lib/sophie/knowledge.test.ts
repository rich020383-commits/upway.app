import { describe, expect, it } from 'vitest';
import { FORBIDDEN_COST_PATTERNS, KNOWLEDGE } from './knowledge';
import { formatCOP } from '@/lib/health/plans-enterprise';
import { IDENTITY_MODULE_COP, IVA_RATE, withIVA } from '@/lib/health/plans';
import { OVERAGE_COP, VOICE_CLONE_MODULE_COP } from '@/lib/pricing/rules';

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
    // El corpus publica el precio con IVA incluido, que es como lo muestra el
    // sitio. Las bases se comprueban aparte en la línea del minuto adicional:
    // Sophie debe poder desglosar el total cuando le preguntan.
    expect(serialized).toContain(formatCOP(withIVA(429000))); // Health: Consultorio 600
    expect(serialized).toContain(formatCOP(withIVA(1199000))); // Health: Clínica Pro 1.800
    expect(serialized).toContain(formatCOP(withIVA(14490000))); // Health: IPS Enterprise
    expect(serialized).toContain(formatCOP(withIVA(399000))); // Inmobiliaria: Starter
    expect(serialized).toContain(formatCOP(withIVA(699000))); // Center: Línea
    expect(serialized).toContain(formatCOP(withIVA(IDENTITY_MODULE_COP))); // Módulo identidad
    // El add-on de voz propia se publica igual: total con IVA y base a la vista.
    expect(serialized).toContain(formatCOP(withIVA(VOICE_CLONE_MODULE_COP))); // Add-on voz propia
    expect(serialized).toContain(`base ${formatCOP(VOICE_CLONE_MODULE_COP)}`);
    // El minuto adicional aparece como precio público en el corpus, y su base
    // queda a la vista para el desglose.
    expect(serialized).toContain(`${formatCOP(withIVA(OVERAGE_COP))}/min`);
    expect(serialized).toContain(`base ${formatCOP(OVERAGE_COP)}/min`);
    expect(IVA_RATE).toBe(0.19);
  });

  it('NUNCA filtra costos de proveedores, márgenes ni TRM al corpus', () => {
    const serialized = JSON.stringify(KNOWLEDGE);
    for (const pattern of FORBIDDEN_COST_PATTERNS) {
      expect(pattern.test(serialized), `el corpus viola ${pattern}`).toBe(false);
    }
  });
});
