/**
 * Rate limiting en memoria, por instancia de proceso.
 *
 * Contexto (REPORTES/AUDITORIA-2026-09.md, hallazgo A12):
 * `/api/sophie` no tenia ningun limite de peticiones. Cualquiera podia hacer
 * loop sobre el endpoint y agotar la cuota pagada de los proveedores de LLM
 * (Gemini, Groq, OpenRouter...), dejando sin servicio a los usuarios reales.
 *
 * LIMITACION CONOCIDA Y ACEPTADA:
 * El contador vive en la memoria del proceso. En despliegues con varias
 * instancias cada una lleva su propio contador, asi que el limite efectivo es
 * `limit * numero_de_instancias`. Esto NO es una solucion para infra
 * multi-instancia: para eso hay que mover el contador a un almacen compartido
 * (Redis / Upstash). Sirve para frenar abuso trivial y para proteger la cuota
 * de los proveedores en el despliegue actual.
 *
 * NO se usa para datos de pacientes ni para autorizacion: un rate limit
 * nunca debe ser la unica barrera de un recurso sensible.
 */

export type RateLimitRule = {
  /** Peticiones permitidas dentro de la ventana. <= 0 desactiva el limite. */
  limit: number;
  /** Tamano de la ventana en milisegundos. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  /** Peticiones restantes en la ventana actual (nunca negativo). */
  remaining: number;
  /** Segundos que faltan para que la ventana se reinicie. */
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Tope defensivo de claves en memoria para no crecer sin limite. */
const MAX_TRACKED_KEYS = 5000;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Consume una unidad de la ventana asociada a `key`.
 *
 * `now` es inyectable para poder testear sin esperar tiempo real.
 */
export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now()
): RateLimitResult {
  // Limite desactivado explicitamente.
  if (!Number.isFinite(rule.limit) || rule.limit <= 0) {
    return { allowed: true, limit: 0, remaining: 0, retryAfterSeconds: 0 };
  }

  if (buckets.size >= MAX_TRACKED_KEYS) pruneExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, limit: rule.limit, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= rule.limit) {
    return { allowed: false, limit: rule.limit, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - existing.count),
    retryAfterSeconds,
  };
}

/**
 * IP del cliente para usar como clave de rate limit.
 *
 * `x-forwarded-for` lo puede falsificar quien llama si el servicio no esta
 * detras de un proxy de confianza. Por eso el endpoint consumidor debe ademas
 * exigir sesion o firma cuando el recurso sea sensible.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Cabeceras estandar de rate limit para adjuntar a la respuesta. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (!result.allowed) headers['Retry-After'] = String(result.retryAfterSeconds);
  return headers;
}

/** Solo para tests: limpia el estado acumulado entre casos. */
export function resetRateLimitStore(): void {
  buckets.clear();
}