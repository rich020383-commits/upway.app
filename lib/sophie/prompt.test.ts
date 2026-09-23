import { describe, expect, it } from 'vitest';
import { buildSophieSystemPrompt, formatContext } from './prompt';
import { FORBIDDEN_COST_PATTERNS, KNOWLEDGE } from './knowledge';

describe('buildSophieSystemPrompt', () => {
  it('incluye identidad, marcadores y reglas clave', () => {
    const prompt = buildSophieSystemPrompt();
    expect(prompt).toContain('Sophie v2');
    expect(prompt).toContain('[CONTACTAR_ASESOR]');
    expect(prompt).toContain('[BOTON_REGISTRO]');
    expect(prompt).toContain('/precios');
    expect(prompt).toContain('IVA en Colombia es 19%');
  });

  it('inyecta el contexto RAG recuperado', () => {
    const chunk = KNOWLEDGE.find((c) => c.id === 'precios-health');
    expect(chunk).toBeDefined();
    const prompt = buildSophieSystemPrompt([chunk!]);
    expect(prompt).toContain(`### ${chunk!.title}`);
    expect(prompt).toContain('Consultorio');
  });

  it('con contexto vacío ofrece el fallback sin prometer cifras', () => {
    const prompt = buildSophieSystemPrompt([]);
    expect(prompt).toContain('Sin contexto recuperado');
    expect(prompt).toContain('/precios');
  });

  it('el prompt jamás contiene costos internos ni de proveedores', () => {
    const prompt = buildSophieSystemPrompt(KNOWLEDGE);
    for (const pattern of FORBIDDEN_COST_PATTERNS) {
      expect(pattern.test(prompt), `el prompt viola ${pattern}`).toBe(false);
    }
  });
});

describe('formatContext', () => {
  it('concatena los chunks con su título', () => {
    const text = formatContext(KNOWLEDGE.slice(0, 2));
    expect(text.startsWith('### ')).toBe(true);
    expect(text).toContain('### ');
  });
});
