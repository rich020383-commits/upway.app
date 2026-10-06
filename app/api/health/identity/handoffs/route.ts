import { NextRequest, NextResponse } from 'next/server';
import { verifySharedSecret } from '@/lib/webhook-verify';
import { runHandoffDrain } from '@/lib/health/identity/handoff-drain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Drenaje de las entregas push del registro conforme al HIS/HCE del cliente.
 *
 * POST/GET /api/health/identity/handoffs
 *  - Autenticación: header `x-upway-cron-secret` (o `Authorization: Bearer ...`)
 *    con el valor de CRON_SECRET. Fail-closed: sin la variable configurada el
 *    endpoint responde 503 y sin secreto válido responde 401 — nadie dispara
 *    tráfico saliente hacia sistemas de clientes por accidente.
 *  - El núcleo (consulta, entrega y reintentos) vive en
 *    `lib/health/identity/handoff-drain.ts`, compartido con el scheduler
 *    interno del proceso (`instrumentation.ts`, cada 5 min) — este endpoint es
 *    el disparador EXTERNO manual/cron; el interno no pasa por HTTP.
 *  - `?organizationId=<id>` limita el drenaje a un inquilino (soporte).
 */

function providedSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-upway-cron-secret');
  if (header) return header;
  const authorization = req.headers.get('authorization');
  return authorization ? authorization.replace(/^Bearer\s+/i, '') : null;
}

async function drain(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) {
    console.error('[handoffs] CRON_SECRET no configurado: drenaje deshabilitado (fail-closed).');
    return NextResponse.json({ error: 'Drenaje no configurado' }, { status: 503 });
  }
  if (!verifySharedSecret(providedSecret(req), secret)) {
    // Diagnóstico de soporte: la longitud del valor esperado permite distinguir
    // si el proceso tiene el secreto vigente o uno heredado de un deploy anterior
    // (solo la longitud — nada reversible ni del secreto). Sin esta señal, un
    // 401 es indistinguible de "el deploy no aplicó las env vars".
    return NextResponse.json(
      { error: 'No autorizado', expectedLength: secret.trim().length },
      { status: 401 },
    );
  }

  const organizationId = req.nextUrl.searchParams.get('organizationId');
  const result = await runHandoffDrain({ organizationId });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return drain(req);
}

export async function POST(req: NextRequest) {
  return drain(req);
}
