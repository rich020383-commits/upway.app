import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { createSession } from '@/lib/demo/store';
import { getSessionUser } from '@/lib/session';

export const maxDuration = 30;

const createSchema = z.object({
  phone: z.string().trim().min(8, 'Número muy corto').max(20, 'Número muy largo'),
  nombre: z.string().trim().optional().nullable(),
  institucion: z.string().trim().optional().nullable(),
});

const RULE = { limit: 10, windowMs: 60 * 60 * 1000 } as const; // 10 sesiones por IP y hora

/** Visitante sin cuenta: 1 demo por IP cada 24 horas. Protege el SIP Trunking de pruebas sin intención de compra. */
const ANON_RULE = { limit: 1, windowMs: 24 * 60 * 60 * 1000 } as const;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Verificar si el visitante tiene cuenta activa en Upway
  const user = await getSessionUser(req);
  const isAuthenticated = !!user;

  // Límite para visitantes anónimos: sin cuenta = 1 demo por día
  if (!isAuthenticated) {
    const anonRate = checkRateLimit(`demo-anon:${ip}`, ANON_RULE);
    if (!anonRate.allowed) {
      return NextResponse.json(
        {
          error: 'Límite de prueba en vivo alcanzado: 1 demo por día sin cuenta.',
          code: 'DEMO_LIMIT_REACHED',
          retryAfterSeconds: anonRate.retryAfterSeconds,
        },
        { status: 429, headers: rateLimitHeaders(anonRate) },
      );
    }
  }

  // Límite general de sesiones (aplica a todos)
  const rate = checkRateLimit(`demo-session:${ip}`, RULE);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes de demo. Intenta de nuevo en una hora.' },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400, headers: rateLimitHeaders(rate) },
    );
  }

  const { phone, nombre, institucion } = parsed.data;
  let sesion;
  try {
    sesion = createSession(phone, nombre, institucion);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Número de teléfono inválido' },
      { status: 400, headers: rateLimitHeaders(rate) },
    );
  }

  return NextResponse.json(
    { sessionId: sesion.id, status: sesion.status, createdAt: sesion.createdAt },
    { status: 201, headers: rateLimitHeaders(rate) },
  );
}