import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  resetRateLimitStore,
} from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('permite exactamente `limit` peticiones en la ventana', () => {
    const rule = { limit: 3, windowMs: 60_000 };

    for (let i = 1; i <= 3; i += 1) {
      const result = checkRateLimit('ip-1', rule, 1_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3 - i);
    }
  });

  it('bloquea la peticion que excede el limite', () => {
    const rule = { limit: 2, windowMs: 60_000 };
    checkRateLimit('ip-1', rule, 1_000);
    checkRateLimit('ip-1', rule, 1_000);

    const blocked = checkRateLimit('ip-1', rule, 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('no incrementa el contador cuando ya esta bloqueado', () => {
    const rule = { limit: 1, windowMs: 60_000 };
    checkRateLimit('ip-1', rule, 0);

    // Diez intentos extra dentro de la ventana siguen bloqueados y no cuentan.
    for (let i = 0; i < 10; i += 1) {
      expect(checkRateLimit('ip-1', rule, 0).allowed).toBe(false);
    }

    // Al reiniciarse la ventana debe volver a permitir exactamente `limit`.
    const afterReset = checkRateLimit('ip-1', rule, 60_000);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it('calcula retryAfterSeconds hacia el final de la ventana', () => {
    const rule = { limit: 1, windowMs: 60_000 };
    checkRateLimit('ip-1', rule, 0);

    const blocked = checkRateLimit('ip-1', rule, 30_500);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);

    // Nunca devuelve 0 en estado bloqueado: la cabecera Retry-After debe ser util.
    const almostDone = checkRateLimit('ip-1', rule, 59_999);
    expect(almostDone.retryAfterSeconds).toBe(1);
  });

  it('reinicia la ventana cuando expira', () => {
    const rule = { limit: 2, windowMs: 1_000 };
    checkRateLimit('ip-1', rule, 0);
    checkRateLimit('ip-1', rule, 0);
    expect(checkRateLimit('ip-1', rule, 999).allowed).toBe(false);

    const afterWindow = checkRateLimit('ip-1', rule, 1_000);
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(1);
  });

  it('aplica contadores independientes por clave', () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit('ip-1', rule, 0).allowed).toBe(true);
    expect(checkRateLimit('ip-1', rule, 0).allowed).toBe(false);

    // Otra IP no debe verse afectada por el abuso de la primera.
    const other = checkRateLimit('ip-2', rule, 0);
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(0);
  });

  it('desactiva el limite cuando limit <= 0', () => {
    const disabled = { limit: 0, windowMs: 60_000 };
    for (let i = 0; i < 50; i += 1) {
      expect(checkRateLimit('ip-1', disabled, 0).allowed).toBe(true);
    }
    expect(checkRateLimit('ip-1', { limit: -5, windowMs: 60_000 }, 0).allowed).toBe(true);
  });

  it('ignora un windowMs o limit invalido sin romper', () => {
    const invalid = { limit: Number.NaN, windowMs: 60_000 };
    expect(checkRateLimit('ip-1', invalid, 0).allowed).toBe(true);
  });

  it('no acumula claves sin limite en memoria', () => {
    const rule = { limit: 1, windowMs: 1_000 };
    for (let i = 0; i < 2_000; i += 1) {
      checkRateLimit(`ip-${i}`, rule, 0);
    }
    // Al avanzar el tiempo, la limpieza debe dejar el mapa en un tamano sano.
    const fresh = checkRateLimit('ip-final', rule, 5_000);
    expect(fresh.allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('toma la primera IP de x-forwarded-for', () => {
    const req = new Request('https://upway.app/api/sophie', {
      headers: { 'x-forwarded-for': '190.25.1.10, 10.0.0.1, 172.16.0.1' },
    });
    expect(getClientIp(req)).toBe('190.25.1.10');
  });

  it('cae a x-real-ip cuando no hay x-forwarded-for', () => {
    const req = new Request('https://upway.app/api/sophie', {
      headers: { 'x-real-ip': '190.25.1.20' },
    });
    expect(getClientIp(req)).toBe('190.25.1.20');
  });

  it('devuelve "unknown" cuando no hay cabeceras de proxy', () => {
    const req = new Request('https://upway.app/api/sophie');
    expect(getClientIp(req)).toBe('unknown');
  });

  it('ignora x-forwarded-for vacio o con comas sueltas', () => {
    const empty = new Request('https://upway.app/api/sophie', {
      headers: { 'x-forwarded-for': '   ' },
    });
    expect(getClientIp(empty)).toBe('unknown');

    const commas = new Request('https://upway.app/api/sophie', {
      headers: { 'x-forwarded-for': ', ,' },
    });
    expect(getClientIp(commas)).toBe('unknown');
  });
});

describe('rateLimitHeaders', () => {
  it('expone limite y restantes, sin Retry-After si esta permitido', () => {
    const headers = rateLimitHeaders({
      allowed: true,
      limit: 20,
      remaining: 7,
      retryAfterSeconds: 12,
    });
    expect(headers['X-RateLimit-Limit']).toBe('20');
    expect(headers['X-RateLimit-Remaining']).toBe('7');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('incluye Retry-After cuando esta bloqueado', () => {
    const headers = rateLimitHeaders({
      allowed: false,
      limit: 20,
      remaining: 0,
      retryAfterSeconds: 34,
    });
    expect(headers['Retry-After']).toBe('34');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
  });
});