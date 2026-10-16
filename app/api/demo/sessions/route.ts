import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { createSession } from '@/lib/demo/store';

export const maxDuration = 30;

const createSchema = z.object({
  phone: z.string().trim().min(8, 'Número muy corto').max(20, 'Número muy largo'),
  nombre: z.string().trim().optional().nullable(),
  institucion: z.string().trim().optional().nullable(),
});

const RULE = { limit: 10, windowMs: 60 * 60 * 1000 } as const; // 10 sesiones por IP y hora

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
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
  const sesion = createSession(phone, nombre, institucion);

  return NextResponse.json(
    { sessionId: sesion.id, status: sesion.status, createdAt: sesion.createdAt },
    { status: 201, headers: rateLimitHeaders(rate) },
  );
}