import { describe, expect, it } from 'vitest';
import { normalize, retrieve, tokenize } from './rag';

describe('normalize / tokenize', () => {
  it('quita tildes y normaliza a minúsculas', () => {
    expect(normalize('Cotización')).toBe('cotizacion');
    expect(tokenize('¿Cuánto cuesta el plan Clínica Pro?')).toContain('clinica');
  });

  it('filtra stopwords y tokens de un solo carácter', () => {
    expect(tokenize('de la el a')).toEqual([]);
  });
});

describe('retrieve (mini-RAG léxico)', () => {
  it('recupera los planes de salud ante una pregunta de precio', () => {
    const hits = retrieve('¿Cuánto cuesta el plan Consultorio para mi clínica?');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((h) => h.id)).toContain('precios-health');
    const scores = hits.map((h) => h.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('encuentra la política de precios aunque la consulta venga con acentos', () => {
    const hits = retrieve('cotización y tarifas con IVA');
    expect(hits.map((h) => h.id)).toContain('politica-precios');
  });

  it('respeta el topK', () => {
    const hits = retrieve('planes precios tarifas minutos agenda', { topK: 2 });
    expect(hits.length).toBeLessThanOrEqual(2);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('devuelve vacío sin consulta o sin coincidencias', () => {
    expect(retrieve('')).toEqual([]);
    expect(retrieve('   ')).toEqual([]);
    expect(retrieve('zzzzqqqq')).toEqual([]);
  });

  it('es determinista: misma consulta, mismo orden', () => {
    const a = retrieve('agendar citas agenda recordatorios');
    const b = retrieve('agendar citas agenda recordatorios');
    expect(a.map((h) => h.id)).toEqual(b.map((h) => h.id));
  });

  it('encuentra activación y límites de alcance', () => {
    expect(retrieve('cuánto demora activar el flujo').map((h) => h.id)).toContain('activacion');
    expect(retrieve('¿pueden hacer cobranza o ventas?').map((h) => h.id)).toContain('limites-alcance');
  });
});
