import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
  type RateLimitRule,
} from '@/lib/rate-limit';

/**
 * Freno de cuota para las rutas /api/voice/*.
 *
 * Por qué existe: esas rutas gastan dinero real en cada llamada — TTS de
 * muestra, diseño/clon de voz y, sobre todo, llamadas salientes a un número de
 * teléfono. Sin limite, una sesion robada (o un script) podia agotar la cuota
 * de Telnyx o marcar a destinos arbitrarios en bucle. Misma familia del
 * hallazgo A12 de la auditoria 2026-09 (`/api/sophie` sin limite) y del
 * Financial Drain de `/api/vapi/create`.
 *
 * La clave lleva el id del usuario autenticado, no la IP: el rate limit se
 * aplica DESPUES de validar sesion, asi que `x-forwarded-for` (manipulable por
 * quien llama) no sirve para eludirlo y un atacante sin sesion solo recibe un
 * 401 sin llegar nunca a Telnyx.
 *
 * LIMITACION CONOCIDA (igual que lib/rate-limit.ts): el contador vive en la
 * memoria del proceso. Con varias instancias el limite efectivo es
 * `limit * instancias`; no es una solucion para infra multi-instancia.
 */

export type VoiceAction =
  /** POST /api/voice/calls — llamada saliente (la mas cara) */
  | 'call'
  /** POST /api/voice/preview — sintesis de voz por muestra */
  | 'preview'
  /** POST /api/voice/clones — diseño o clon de voz propio */
  | 'clone'
  /** POST|PATCH /api/voice/agents — provisiona el asistente en Telnyx */
  | 'agent'
  /** GET /api/voice/voices y /api/voice/clones — dos llamadas Telnyx por request */
  | 'catalog';

export const VOICE_RATE_RULES: Record<VoiceAction, RateLimitRule> = {
  call: { limit: 5, windowMs: 60_000 },
  preview: { limit: 20, windowMs: 60_000 },
  clone: { limit: 5, windowMs: 60_000 },
  agent: { limit: 10, windowMs: 60_000 },
  catalog: { limit: 30, windowMs: 60_000 },
};

const BLOCKED_MESSAGES: Record<VoiceAction, string> = {
  call: 'Demasiadas llamadas de prueba seguidas. Espera un minuto antes de marcar de nuevo.',
  preview: 'Demasiadas muestras de voz seguidas. Espera un minuto y vuelve a intentarlo.',
  clone: 'Demasiadas creaciones de voz seguidas. Espera un minuto y vuelve a intentarlo.',
  agent: 'Demasiadas actualizaciones del asistente seguidas. Espera un minuto y vuelve a intentarlo.',
  catalog: 'Estás consultando el catálogo de voces demasiado rápido. Espera un minuto.',
};

/**
 * Consume una unidad de la ventana de `action` para `userId`.
 * Llamar SIEMPRE despues de validar la sesion.
 * `now` es inyectable (igual que en lib/rate-limit) para testear sin esperar.
 */
export function checkVoiceRateLimit(
  action: VoiceAction,
  userId: string,
  now: number = Date.now()
): RateLimitResult {
  return checkRateLimit(`voice:${action}:${userId}`, VOICE_RATE_RULES[action], now);
}

/** 429 con las cabeceras estandar y un mensaje entendible para el usuario. */
export function voiceRateLimitResponse(action: VoiceAction, result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: BLOCKED_MESSAGES[action], retryAfterSeconds: result.retryAfterSeconds },
    { status: 429, headers: rateLimitHeaders(result) }
  );
}
