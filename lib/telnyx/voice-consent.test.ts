import { describe, it, expect } from 'vitest';
import {
  CALL_CONSENT_REQUIRED_MESSAGE,
  TELNYX_GREETING_MAX,
  TELNYX_INSTRUCTIONS_MAX,
  VOICE_PRIVACY_NOTICE,
  AGENT_DATA_MINIMIZATION,
  buildVoiceGreeting,
  buildAgentInstructions,
} from './voice-consent';

describe('buildVoiceGreeting — aviso de privacidad en la voz', () => {
  it('encabeza el saludo con el aviso de grabacion y tratamiento', () => {
    const greeting = buildVoiceGreeting({ agentName: 'Sofía', businessName: 'Clínica Norte' });
    expect(greeting.startsWith(VOICE_PRIVACY_NOTICE)).toBe(true);
    expect(greeting).toContain('Sofía');
    expect(greeting).toContain('Clínica Norte');
    expect(greeting).toMatch(/grabada/i);
    expect(greeting).toMatch(/autorizas el tratamiento/i);
  });

  it('respeta el limite de caracteres de Telnyx con textos largos', () => {
    const greeting = buildVoiceGreeting({
      agentName: 'A'.repeat(80),
      businessName: 'B'.repeat(400),
    });
    expect(greeting.length).toBeLessThanOrEqual(TELNYX_GREETING_MAX);
    // El aviso nunca se recorta: es la parte legal.
    expect(greeting.startsWith(VOICE_PRIVACY_NOTICE)).toBe(true);
    expect(greeting.endsWith('…')).toBe(true);
  });

  it('no recorta cuando los nombres realistas caben enteros', () => {
    const greeting = buildVoiceGreeting({ agentName: 'Sofía', businessName: 'Clínica Norte' });
    expect(greeting.endsWith('…')).toBe(false);
    expect(greeting).toContain('¿En qué te puedo ayudar hoy?');
  });

  it('funciona con nombres vacios sin dejar espacios dobles', () => {
    const greeting = buildVoiceGreeting({ agentName: '   ', businessName: '' });
    expect(greeting).not.toMatch(/  /);
    expect(greeting).toContain('el equipo');
    expect(greeting).toContain('Upway');
  });
});

describe('AGENT_DATA_MINIMIZATION — regla de minimizacion con excepcion de identidad', () => {
  it('prohibe repetir identidad fuera del paso de captura', () => {
    expect(AGENT_DATA_MINIMIZATION).toMatch(/No repitas el nombre completo/i);
    expect(AGENT_DATA_MINIMIZATION).toMatch(/SALVO el paso de identidad/i);
  });

  // Este es el test que importa: si alguien "optimiza" la regla y deja de
  // exceptuar la identidad, el agente deja de releer el documento y el
  // registro conforme pierde valor probatorio (Res. 866/2021). La minimizacion
  // NUNCA puede comerse la relectura.
  it('excepcion de identidad que PREVALECE sobre la minimizacion', () => {
    expect(AGENT_DATA_MINIMIZATION).toMatch(/EXCEPCION OBLIGATORIA/);
    expect(AGENT_DATA_MINIMIZATION).toMatch(/PREVALECE/);
    expect(AGENT_DATA_MINIMIZATION).toMatch(/digito a digito/i);
    expect(AGENT_DATA_MINIMIZATION).toMatch(/Res\. 866\/2021/);
    expect(AGENT_DATA_MINIMIZATION).toMatch(/NUNCA se toma del dictado libre/i);
  });
});

describe('buildAgentInstructions — la regla no se puede comer por el recorte', () => {
  const base = { businessName: 'Clinica Norte', nicho: 'salud', tiendaId: 'abc' };

  it('incluye la regla, el contexto y el guion del cliente', () => {
    const out = buildAgentInstructions({ ...base, reglas: 'Responde y agenda.' });
    expect(out).toContain('Clinica Norte');
    expect(out).toContain('abc');
    expect(out).toContain(AGENT_DATA_MINIMIZATION);
    expect(out).toContain('Responde y agenda.');
  });

  it('con guion enorme, recorta el guion y NUNCA la regla', () => {
    const out = buildAgentInstructions({ ...base, reglas: 'X'.repeat(20000) });
    expect(out.length).toBeLessThanOrEqual(TELNYX_INSTRUCTIONS_MAX);
    // La parte que se pierde es la del cliente, no el freno de minimizacion.
    expect(out).toContain(AGENT_DATA_MINIMIZATION);
    expect(out).toMatch(/EXCEPCION OBLIGATORIA/);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('CALL_CONSENT_REQUIRED_MESSAGE', () => {
  it('explica la obligacion y cita la norma', () => {
    expect(CALL_CONSENT_REQUIRED_MESSAGE).toMatch(/autorizo ser llamado/i);
    expect(CALL_CONSENT_REQUIRED_MESSAGE).toMatch(/Ley 1581/);
  });
});
