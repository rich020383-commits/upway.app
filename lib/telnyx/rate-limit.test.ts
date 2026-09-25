import { describe, it, expect, beforeEach } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';
import {
  VOICE_RATE_RULES,
  checkVoiceRateLimit,
  voiceRateLimitResponse,
  type VoiceAction,
} from './rate-limit';

describe('voice rate limit — freno de cuota /api/voice/*', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('define una regla para cada accion de voz', () => {
    const actions: VoiceAction[] = ['call', 'preview', 'clone', 'agent', 'catalog'];
    expect(Object.keys(VOICE_RATE_RULES).sort()).toEqual([...actions].sort());
    for (const action of actions) {
      expect(VOICE_RATE_RULES[action].limit).toBeGreaterThan(0);
      expect(VOICE_RATE_RULES[action].windowMs).toBeGreaterThan(0);
    }
    // La llamada saliente es la mas cara: es la que mas se restringe.
    expect(VOICE_RATE_RULES.call.limit).toBeLessThanOrEqual(VOICE_RATE_RULES.preview.limit);
  });

  it('permite hasta el limite y bloquea la peticion siguiente', () => {
    const rule = VOICE_RATE_RULES.call;
    for (let i = 1; i <= rule.limit; i += 1) {
      const res = checkVoiceRateLimit('call', 'user-1');
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(rule.limit - i);
    }
    const blocked = checkVoiceRateLimit('call', 'user-1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('la ventana se reinicia cuando vence', () => {
    const start = Date.now();
    checkVoiceRateLimit('call', 'user-1', start);
    const withinWindow = checkVoiceRateLimit('call', 'user-1', start + 30_000);
    expect(withinWindow.allowed).toBe(true);
    const afterWindow = checkVoiceRateLimit('call', 'user-1', start + VOICE_RATE_RULES.call.windowMs + 1);
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(VOICE_RATE_RULES.call.limit - 1);
  });

  it('cada usuario tiene su propia ventana', () => {
    const rule = VOICE_RATE_RULES.call;
    for (let i = 0; i < rule.limit; i += 1) checkVoiceRateLimit('call', 'user-1');
    expect(checkVoiceRateLimit('call', 'user-1').allowed).toBe(false);
    expect(checkVoiceRateLimit('call', 'user-2').allowed).toBe(true);
  });

  it('una accion no consume la ventana de otra', () => {
    const rule = VOICE_RATE_RULES.call;
    for (let i = 0; i < rule.limit; i += 1) checkVoiceRateLimit('call', 'user-1');
    expect(checkVoiceRateLimit('preview', 'user-1').allowed).toBe(true);
  });

  it('devuelve 429 con Retry-After y mensaje en español', async () => {
    const rule = VOICE_RATE_RULES.clone;
    for (let i = 0; i < rule.limit; i += 1) checkVoiceRateLimit('clone', 'user-1');
    const blocked = checkVoiceRateLimit('clone', 'user-1');

    const res = voiceRateLimitResponse('clone', blocked);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe(String(blocked.retryAfterSeconds));
    expect(res.headers.get('X-RateLimit-Limit')).toBe(String(rule.limit));

    const body = await res.json();
    expect(body.error).toMatch(/minuto/i);
    expect(body.retryAfterSeconds).toBe(blocked.retryAfterSeconds);
  });
});
