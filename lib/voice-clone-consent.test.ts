import { describe, it, expect } from 'vitest';
import {
  CLONE_HARD_SECONDS,
  CLONE_IDEAL_SECONDS,
  CONSENT_SCRIPT_VERSION,
  buildConsentScript,
  buildSampleScript,
  cloneConsentSchema,
  defaultPurpose,
  hashAudio,
} from './voice-clone-consent';

describe('buildConsentScript — el párrafo que da la protección', () => {
  const base = { consentingName: 'María Restrepo', businessName: 'Clínica Andes' };

  it('identifica al TITULAR, no a la sede', () => {
    const texto = buildConsentScript(base);
    expect(texto).toContain('María Restrepo');
    expect(texto).toContain('Clínica Andes');
    // Si solo apareciera la sede, no habría autorización válida de nadie.
    expect(texto).toMatch(/Yo,/);
  });

  it('incluye el documento cuando se entrega', () => {
    expect(buildConsentScript({ ...base, document: 'CC 1.234.567' })).toContain('CC 1.234.567');
  });

  it('declara los cuatro elementos que la ley exige', () => {
    const texto = buildConsentScript(base);
    expect(texto).toMatch(/libre, previa, informada e inequívoca/); // libertad y consentimiento
    expect(texto).toMatch(/dato sensible/); // tratamiento de dato sensible
    expect(texto).toMatch(/aproximación estadística y no una copia/); // información al titular
    expect(texto).toMatch(/puedo revocar este consentimiento/); // y siempre revocable
  });

  it('prohíbe expresamente la suplantación de terceros', () => {
    expect(buildConsentScript(base)).toMatch(/no puede usarse para suplantar/);
  });

  it('cae en marcadores si la persona aún no escribió su nombre', () => {
    const texto = buildConsentScript({ consentingName: '   ', businessName: '' });
    expect(texto).toContain('[mi nombre]');
    expect(texto).toContain('[la sede]');
  });

  it('tiene versión: sin ella no se puede probar qué se leyó', () => {
    expect(CONSENT_SCRIPT_VERSION).toMatch(/^v\d/);
  });
});

describe('buildSampleScript — la muestra que va al modelo', () => {
  it('es corta y en español: el modelo recorta solo a 10 s', () => {
    const texto = buildSampleScript({ name: 'María', businessName: 'Clínica Andes' });
    // ~30 palabras ≈ 10 s habladas. Más texto es tiempo desperdiciado.
    expect(texto.split(/\s+/).length).toBeLessThanOrEqual(40);
    expect(texto).toContain('María');
    expect(texto).toContain('Clínica Andes');
  });

  it('incluye números y una fecha: eso es lo que prueba que la voz los dice bien', () => {
    const texto = buildSampleScript({ name: 'Ana' });
    expect(texto).toMatch(/quince/);
    expect(texto).toMatch(/nueve/);
    expect(texto).toMatch(/cuatro diez/);
  });
});

describe('duración de la muestra', () => {
  it('el ideal del modelo es más corto que el tope duro', () => {
    expect(CLONE_IDEAL_SECONDS.min).toBe(5);
    expect(CLONE_IDEAL_SECONDS.max).toBe(10);
    expect(CLONE_HARD_SECONDS.max).toBeGreaterThan(CLONE_IDEAL_SECONDS.max);
  });
});

describe('cloneConsentSchema', () => {
  it('exige el nombre de quien autoriza', () => {
    expect(cloneConsentSchema.safeParse({ consentingName: 'A' }).success).toBe(false);
    expect(cloneConsentSchema.safeParse({ consentingName: '  ' }).success).toBe(false);
    expect(cloneConsentSchema.safeParse({ consentingName: 'María Restrepo' }).success).toBe(true);
  });

  it('el documento y la finalidad son opcionales', () => {
    const r = cloneConsentSchema.safeParse({ consentingName: 'María Restrepo' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.consentingDocument).toBeUndefined();
  });
});

describe('hashAudio — la evidencia', () => {
  it('es estable para el mismo audio (prueba que no se alteró)', () => {
    const bytes = new TextEncoder().encode('audio-de-autorizacion');
    expect(hashAudio(bytes)).toBe(hashAudio(bytes));
    expect(hashAudio(bytes)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('cambia si cambia un solo byte', () => {
    const a = new TextEncoder().encode('autorizacion-original');
    const b = new TextEncoder().encode('autorizacion-original!');
    expect(hashAudio(a)).not.toBe(hashAudio(b));
  });
});

describe('defaultPurpose', () => {
  it('declara para qué se usa la voz cuando la sede no escribe nada', () => {
    expect(defaultPurpose('Clínica Andes')).toContain('Clínica Andes');
    expect(defaultPurpose(null)).toMatch(/atender llamadas/);
  });
});
