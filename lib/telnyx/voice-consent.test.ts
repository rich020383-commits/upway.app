import { describe, it, expect } from 'vitest';
import {
  CALL_CONSENT_REQUIRED_MESSAGE,
  TELNYX_GREETING_MAX,
  VOICE_PRIVACY_NOTICE,
  buildVoiceGreeting,
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

describe('CALL_CONSENT_REQUIRED_MESSAGE', () => {
  it('explica la obligacion y cita la norma', () => {
    expect(CALL_CONSENT_REQUIRED_MESSAGE).toMatch(/autorizo ser llamado/i);
    expect(CALL_CONSENT_REQUIRED_MESSAGE).toMatch(/Ley 1581/);
  });
});
