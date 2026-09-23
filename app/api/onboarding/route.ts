import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';
import { stageErrors, type OnboardingConfig } from '@/lib/onboarding/types';

/**
 * Onboarding de verticales no-clínicas (Inmobiliaria / Center).
 * Valida el envío server-side reutilizando las mismas reglas que el wizard
 * (stageErrors) y responde el estado. La persistencia por usuario queda
 * pendiente de su modelo en Prisma (VerticalOnboardingSession); mientras
 * tanto, el wizard guarda su avance en cliente y trata el guardado como
 * best-effort.
 */

const CONFIGS: Record<string, OnboardingConfig> = {
  inmobiliaria: INMOBILIARIA_ONBOARDING,
  center: CENTER_ONBOARDING,
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const segment = req.nextUrl.searchParams.get('segment') ?? '';
  if (!(segment in CONFIGS)) {
    return NextResponse.json({ error: 'invalid_segment' }, { status: 400 });
  }

  // Sin persistencia server-side aún: el wizard empieza en blanco.
  return NextResponse.json({ answers: {}, step: 0 });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    segment?: string;
    answers?: Record<string, string>;
    step?: number;
    stageId?: string;
    submit?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const segment = body.segment ?? '';
  const config = CONFIGS[segment];
  if (!config) {
    return NextResponse.json({ error: 'invalid_segment' }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'invalid_answers' }, { status: 400 });
  }

  // Al enviar, validamos todas las etapas en el servidor (misma regla que el cliente).
  if (body.submit) {
    for (const stage of config.stages) {
      const errs = stageErrors(stage, body.answers);
      if (errs.length > 0) {
        return NextResponse.json({ error: 'incomplete', stageId: stage.id, errors: errs }, { status: 422 });
      }
    }
    // TODO(persistencia): guardar PENDING_REVIEW cuando exista VerticalOnboardingSession.
    return NextResponse.json({ ok: true, status: 'PENDING_REVIEW' });
  }

  return NextResponse.json({ ok: true, status: 'DRAFT' });
}