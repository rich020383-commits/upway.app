import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  CONSENT_SCRIPT_VERSION,
  cloneConsentSchema,
  defaultPurpose,
  hashAudio,
} from '@/lib/voice-clone-consent';
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

/** Segundos reportados por el grabador del panel; null si no vienen o no son válidos. */
function toSecondsOrNull(value: FormDataEntryValue | null): number | null {
  const n = Number(typeof value === 'string' ? value : NaN);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

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

      // ── Autorización (Ley 1581) ──────────────────────────────────────
      // Clonar una voz es tratar un dato biométrico sensible. Sin autorización
      // del TITULAR registrada no creamos el clon: la sede no puede consentir en
      // nombre de su empleado ni de su socio. Ver lib/voice-clone-consent.ts.
      const consentParsed = cloneConsentSchema.safeParse({
        consentingName: String(form.get('consent_name') ?? ''),
        consentingDocument: String(form.get('consent_document') ?? '').trim() || undefined,
        purpose: String(form.get('consent_purpose') ?? '').trim() || undefined,
      });
      if (!consentParsed.success) {
        return NextResponse.json(
          { error: consentParsed.error.issues[0]?.message ?? 'Falta la autorización de quien prestó su voz.' },
          { status: 400 }
        );
      }
      const consentAudio = form.get('consent_audio');
      if (!(consentAudio instanceof File) || consentAudio.size <= 0) {
        return NextResponse.json(
          {
            error:
              'Falta la grabación de la autorización: la persona debe leer y grabar el párrafo de consentimiento.',
          },
          { status: 400 }
        );
      }
      // La sede a la que pertenece el clon: sin ella no hay a quién vincular la
      // autorización, y tampoco se puede probar la propiedad.
      const tiendaId = String(form.get('tiendaId') ?? '').trim();
      if (!tiendaId) {
        return NextResponse.json({ error: 'Falta la sede (tiendaId).' }, { status: 400 });
      }
      const tienda = await prisma.tienda.findFirst({ where: { id: tiendaId, userId: user.id } });
      if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
      if (!tienda.organizationId) {
        return NextResponse.json(
          {
            error:
              'La sede todavía no está vinculada a una organización. Completa el onboarding antes de clonar una voz.',
          },
          { status: 409 }
        );
      }

      const sampleBytes = await file.arrayBuffer();
      const consentBytes = await consentAudio.arrayBuffer();

      const res = await createVoiceCloneFromUpload({
        bytes: sampleBytes,
        filename: file.name || 'muestra-voz.wav',
        contentType: file.type || 'audio/wav',
        name,
        gender,
      });
      const clone = mapClonesToOptions([(res?.data ?? res) as VoiceCloneRaw])[0] ?? null;

      // La evidencia se guarda DESPUÉS de crear el clon y su fallo nunca
      // rompe la operación. El audio de autorización se hashea y se descarta
      // en esta misma petición: Upway no lo almacena.
      let authorizationRecorded = false;
      try {
        await prisma.voiceCloneAuthorization.create({
          data: {
            organizationId: tienda.organizationId,
            tiendaId: tienda.id,
            consentingName: consentParsed.data.consentingName,
            consentingDocument: consentParsed.data.consentingDocument ?? null,
            purpose: consentParsed.data.purpose ?? defaultPurpose(tienda.nombre),
            scriptVersion: CONSENT_SCRIPT_VERSION,
            authorizationSha256: hashAudio(consentBytes),
            sampleSha256: hashAudio(sampleBytes),
            sampleSeconds: toSecondsOrNull(form.get('sample_seconds')),
            voiceCloneId: (res?.data?.id as string | undefined) ?? null,
            createdByUserId: user.id,
          },
        });
        authorizationRecorded = true;
      } catch (err) {
        console.error('[voice] no se pudo guardar la autorización del clon', err);
      }

      return NextResponse.json({ ok: true, clone, authorizationRecorded });
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
