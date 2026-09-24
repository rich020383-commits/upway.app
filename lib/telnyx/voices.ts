/**
 * Voces de Telnyx para el agente (catálogo TTS + clones propios).
 * Lógica pura: transforma la respuesta cruda de la API de Telnyx en las
 * opciones que consume el selector de voz del panel /health/production.
 * Sin red — todo es testeable con fixtures.
 *
 * Formato de voz de Telnyx (TTS + AI Assistant):
 *   Telnyx.<modelo>.<voz>   ej. Telnyx.KokoroTTS.af_heart
 *   (el TTS también admite <proveedor>.<voz> suelto)
 */

export type TtsVoice = {
  provider?: string | null;
  name?: string | null;
  voice_id?: string | null;
  language?: string | null;
  gender?: string | null;
  hosted?: boolean | null;
};

export type VoiceCloneRaw = {
  id?: string | null;
  name?: string | null;
  provider?: string | null;
  provider_voice_id?: string | null;
  model_id?: string | null;
  language?: string | null;
  gender?: string | null;
  status?: string | null;
};

export type VoiceOption = {
  value: string;
  label: string;
  kind: 'catalog' | 'clone';
  provider: string;
  language?: string | null;
  gender?: string | null;
  cloneId?: string;
  status?: string | null;
};

/** Voz histórica de Upway: la que usan Speak y la creación de assistants. */
export const DEFAULT_AGENT_VOICE = 'Telnyx.female.sofia';

/**
 * Catálogo mínimo garantizado cuando la API de voces de Telnyx no responde.
 * af_heart es la voz de ejemplo oficial de la documentación de Telnyx.
 */
export const FALLBACK_CATALOG: VoiceOption[] = [
  { value: 'Telnyx.KokoroTTS.af_heart', label: 'Kokoro · af_heart (femenina)', kind: 'catalog', provider: 'telnyx' },
  { value: 'Telnyx.KokoroTTS.af_bella', label: 'Kokoro · af_bella (femenina)', kind: 'catalog', provider: 'telnyx' },
  { value: 'Telnyx.KokoroTTS.am_michael', label: 'Kokoro · am_michael (masculina)', kind: 'catalog', provider: 'telnyx' },
  { value: DEFAULT_AGENT_VOICE, label: 'Sofia (clásica, predeterminada)', kind: 'catalog', provider: 'telnyx' },
];

/** Compone el identificador de voz que entienden TTS y el AI Assistant. */
export function buildAssistantVoiceValue(voice: TtsVoice): string {
  const name = (voice.name ?? '').trim();
  const voiceId = (voice.voice_id ?? '').trim();
  if (name.startsWith('Telnyx.')) return name;
  if (voiceId.startsWith('Telnyx.')) return voiceId;
  const provider = (voice.provider ?? 'telnyx').trim() || 'telnyx';
  const prefix = provider.toLowerCase() === 'telnyx' ? 'Telnyx' : provider;
  const body = voiceId || name;
  return body ? `${prefix}.${body}` : '';
}

function voiceLabel(name: string | null | undefined, value: string): string {
  const n = (name ?? '').trim();
  if (n && n !== value) return n;
  // "Telnyx.KokoroTTS.af_heart" → "KokoroTTS · af_heart"
  const parts = value.split('.');
  return parts.length >= 3 ? `${parts[1]} · ${parts.slice(2).join('.')}` : value;
}

/** Catálogo TTS → opciones del selector. Por defecto solo proveedor Telnyx
 *  (los assistant solo aceptan voces Telnyx nativas sin integration secrets). */
export function mapCatalogVoices(
  voices: TtsVoice[] | null | undefined,
  opts?: { provider?: string }
): VoiceOption[] {
  const providerFilter = (opts?.provider ?? 'telnyx').toLowerCase();
  const out: VoiceOption[] = [];
  const seen = new Set<string>();
  for (const raw of voices ?? []) {
    if (!raw) continue;
    const provider = (raw.provider ?? '').trim().toLowerCase();
    if (providerFilter && provider !== providerFilter) continue;
    const value = buildAssistantVoiceValue(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push({
      value,
      label: voiceLabel(raw.name, value),
      kind: 'catalog',
      provider: provider || 'telnyx',
      language: raw.language ?? null,
      gender: raw.gender ?? null,
    });
  }
  return out;
}

/** Clones de la cuenta → opciones del selector (solo provider Telnyx:
 *  un clon de Minimax no es usable por el assistant de voz Telnyx). */
export function mapClonesToOptions(clones: VoiceCloneRaw[] | null | undefined): VoiceOption[] {
  const out: VoiceOption[] = [];
  const seen = new Set<string>();
  for (const raw of clones ?? []) {
    if (!raw?.id) continue;
    const provider = (raw.provider ?? '').trim().toLowerCase();
    if (provider && provider !== 'telnyx') continue;
    const model = (raw.model_id ?? '').trim() || 'Qwen3TTS';
    const voicePart = (raw.provider_voice_id ?? '').trim() || raw.id;
    const value = `Telnyx.${model}.${voicePart}`;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push({
      value,
      label: (raw.name ?? '').trim() || `Clon ${voicePart.slice(0, 8)}`,
      kind: 'clone',
      provider: 'telnyx',
      language: raw.language ?? null,
      gender: raw.gender ?? null,
      cloneId: raw.id,
      status: raw.status ?? null,
    });
  }
  return out;
}

/** Identificador de voz seguro para persistir/provisionar. */
export function isValidVoiceValue(value: string): boolean {
  return /^[\w.\-]{3,140}$/.test(value);
}

/** Límite Telnyx para clonar desde archivo: 5 MB (5–60 s de voz clara). */
export const CLONE_MAX_BYTES = 5 * 1024 * 1024;

export const CLONE_ALLOWED_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
];

/** Devuelve null si el archivo sirve; si no, el motivo en español. */
export function validateCloneFile(file: { type: string; size: number }): string | null {
  if (!CLONE_ALLOWED_TYPES.includes((file.type ?? '').toLowerCase())) {
    return 'Formato no soportado: usa WAV, MP3, FLAC, OGG o M4A.';
  }
  if (file.size <= 0) return 'El archivo está vacío.';
  if (file.size > CLONE_MAX_BYTES) return 'El audio no puede superar 5 MB (ideal: 5–60 s de voz clara).';
  return null;
}

/** Texto corto de muestra para el preview TTS. */
export function buildPreviewText(agentName?: string | null): string {
  const name = (agentName ?? '').trim().slice(0, 40);
  return name
    ? `Hola, soy ${name}. Con gusto te ayudo con citas, dudas y seguimiento. ¿En qué te puedo ayudar hoy?`
    : 'Hola, soy tu asistente de Upway. Con gusto te ayudo con citas, dudas y seguimiento. ¿En qué te puedo ayudar hoy?';
}

