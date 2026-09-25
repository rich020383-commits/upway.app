import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/session';
import {
  generateSpeech,
  getVoiceCloneSample,
  isTelnyxConfigured,
  missingTelnyxEnv,
  type TelnyxBinary,
} from '@/lib/telnyx/client';
import { buildPreviewText, isValidVoiceValue } from '@/lib/telnyx/voices';
import { checkVoiceRateLimit, voiceRateLimitResponse } from '@/lib/telnyx/rate-limit';

export const maxDuration = 30;

const previewSchema = z.object({
  voice: z.string().trim().min(3).max(140).refine(isValidVoiceValue, 'Identificador de voz inválido'),
  text: z.string().trim().max(200).optional(),
  agentName: z.string().trim().max(60).optional(),
  cloneId: z.string().trim().max(60).optional(),
});

// POST /api/voice/preview — muestra de audio corto con la voz elegida.
// Devuelve bytes de audio (audio/mpeg o audio/wav), no JSON.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  // TTS de muestra = cuota pagada: freno por usuario antes de sintetizar.
  const rate = checkVoiceRateLimit('preview', user.id);
  if (!rate.allowed) return voiceRateLimitResponse('preview', rate);
  if (!isTelnyxConfigured()) {
    return NextResponse.json(
      { error: `Telnyx no está configurado: falta ${missingTelnyxEnv().join(', ')}` },
      { status: 503 }
    );
  }

  const parsed = previewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }
  const { voice, cloneId } = parsed.data;
  const text =
    parsed.data.text && parsed.data.text.length >= 3
      ? parsed.data.text
      : buildPreviewText(parsed.data.agentName);

  try {
    let audio: TelnyxBinary;
    try {
      audio = await generateSpeech({ voice, text });
    } catch (err) {
      // Clon aún procesando (status pending): usar el WAV original de la muestra.
      if (!cloneId) throw err;
      audio = await getVoiceCloneSample(cloneId);
    }
    return new NextResponse(audio.bytes, {
      headers: { 'Content-Type': audio.contentType, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[voice] preview failed', err);
    return NextResponse.json({ error: 'No se pudo generar la muestra de voz.' }, { status: 502 });
  }
}
