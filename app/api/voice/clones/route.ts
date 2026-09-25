import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/session';
import {
  createVoiceCloneFromDesign,
  createVoiceCloneFromUpload,
  createVoiceDesign,
  isTelnyxVoiceReady,
  listVoiceClones,
  missingTelnyxVoiceEnv,
  telnyxNotReadyMessage,
} from '@/lib/telnyx/client';
import {
  buildPreviewText,
  mapClonesToOptions,
  validateCloneFile,
  type VoiceCloneRaw,
} from '@/lib/telnyx/voices';
import { checkVoiceRateLimit, voiceRateLimitResponse } from '@/lib/telnyx/rate-limit';

export const maxDuration = 60;

// GET /api/voice/clones — clones de voz de la cuenta Telnyx (para el selector).
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  // Dos llamadas a Telnyx por request: limita el abuso del catálogo.
  const rate = checkVoiceRateLimit('catalog', user.id);
  if (!rate.allowed) return voiceRateLimitResponse('catalog', rate);
  if (!isTelnyxVoiceReady()) {
    return NextResponse.json(
      { error: telnyxNotReadyMessage(missingTelnyxVoiceEnv()) },
      { status: 503 }
    );
  }
  try {
    const res = await listVoiceClones();
    const clones = mapClonesToOptions((res?.data ?? res ?? []) as VoiceCloneRaw[]);
    return NextResponse.json({ ok: true, clones });
  } catch (err) {
    console.error('[voice] list clones failed', err);
    return NextResponse.json({ error: 'No se pudieron listar las voces propias.' }, { status: 502 });
  }
}

const designSchema = z.object({
  mode: z.literal('design'),
  name: z.string().trim().min(2).max(80),
  prompt: z.string().trim().min(10).max(600),
  gender: z.enum(['female', 'male', 'neutral']).optional(),
});

// POST /api/voice/clones — crea una voz propia del cliente:
//  · multipart/form-data → clon desde muestra de audio (≤5MB, 5–60 s)
//  · JSON {mode:'design'} → voz desde prompt (Voice Design → Voice Clone)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  // Diseño/clon de voz: una de las operaciones mas caras del proveedor.
  const rate = checkVoiceRateLimit('clone', user.id);
  if (!rate.allowed) return voiceRateLimitResponse('clone', rate);
  if (!isTelnyxVoiceReady()) {
    return NextResponse.json(
      { error: telnyxNotReadyMessage(missingTelnyxVoiceEnv()) },
      { status: 503 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData().catch(() => null);
      if (!form) return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 });
      const file = form.get('audio_file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Falta la muestra de audio (audio_file).' }, { status: 400 });
      }
      const name = String(form.get('name') ?? '').trim();
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ error: 'Nombre inválido (2–80 caracteres).' }, { status: 400 });
      }
      const fileError = validateCloneFile({ type: file.type, size: file.size });
      if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
      const genderRaw = String(form.get('gender') ?? 'neutral');
      const gender = genderRaw === 'female' || genderRaw === 'male' ? genderRaw : 'neutral';

      const res = await createVoiceCloneFromUpload({
        bytes: await file.arrayBuffer(),
        filename: file.name || 'muestra-voz.wav',
        contentType: file.type || 'audio/wav',
        name,
        gender,
      });
      const clone = mapClonesToOptions([(res?.data ?? res) as VoiceCloneRaw])[0] ?? null;
      return NextResponse.json({ ok: true, clone });
    }

    const parsed = designSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { name, prompt, gender } = parsed.data;
    const design = await createVoiceDesign({ name, prompt, text: buildPreviewText(name) });
    const designId = (design?.data?.id ?? design?.id) as string | undefined;
    if (!designId) {
      return NextResponse.json({ error: 'El servicio de voz de Upway no creó el diseño de voz.' }, { status: 502 });
    }
    const res = await createVoiceCloneFromDesign({
      voiceDesignId: designId,
      name,
      ...(gender ? { gender } : {}),
    });
    const clone = mapClonesToOptions([(res?.data ?? res) as VoiceCloneRaw])[0] ?? null;
    return NextResponse.json({ ok: true, clone });
  } catch (err) {
    console.error('[voice] create clone failed', err);
    return NextResponse.json(
      { error: 'El servicio de voz de Upway no pudo crear la voz propia. Inténtalo de nuevo en un momento.' },
      { status: 502 }
    );
  }
}
