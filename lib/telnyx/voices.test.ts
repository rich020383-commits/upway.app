import { describe, expect, it } from 'vitest';
import {
  CLONE_MAX_BYTES,
  DEFAULT_AGENT_VOICE,
  FALLBACK_CATALOG,
  buildAssistantVoiceValue,
  buildPreviewText,
  isValidVoiceValue,
  mapCatalogVoices,
  mapClonesToOptions,
  validateCloneFile,
  type TtsVoice,
} from './voices';

describe('buildAssistantVoiceValue', () => {
  it('compone Telnyx.<modelo>.<voz> desde voice_id con modelo (doc Telnyx)', () => {
    expect(
      buildAssistantVoiceValue({ provider: 'telnyx', name: 'af_heart', voice_id: 'KokoroTTS.af_heart' })
    ).toBe('Telnyx.KokoroTTS.af_heart');
  });

  it('respeta identificadores ya completos (name o voice_id con prefijo)', () => {
    expect(buildAssistantVoiceValue({ name: 'Telnyx.KokoroTTS.af_heart', voice_id: 'otra' })).toBe(
      'Telnyx.KokoroTTS.af_heart'
    );
    expect(buildAssistantVoiceValue({ provider: 'telnyx', voice_id: DEFAULT_AGENT_VOICE })).toBe(
      DEFAULT_AGENT_VOICE
    );
  });

  it('usa formato proveedor.voz cuando voice_id no trae modelo', () => {
    expect(buildAssistantVoiceValue({ provider: 'telnyx', voice_id: 'af_heart' })).toBe('Telnyx.af_heart');
  });

  it('devuelve vacío si no hay identificador', () => {
    expect(buildAssistantVoiceValue({})).toBe('');
  });
});

describe('mapCatalogVoices', () => {
  const raw: TtsVoice[] = [
    { provider: 'telnyx', name: 'af_heart', voice_id: 'KokoroTTS.af_heart', language: 'en', gender: 'female' },
    { provider: 'telnyx', name: 'af_heart', voice_id: 'KokoroTTS.af_heart' }, // duplicada
    { provider: 'aws', name: 'Lucia', voice_id: 'Lucia' }, // otro proveedor
    { provider: 'telnyx', voice_id: DEFAULT_AGENT_VOICE },
  ];

  it('filtra a Telnyx, sin duplicados y con etiqueta', () => {
    const out = mapCatalogVoices(raw);
    expect(out).toHaveLength(2);
    expect(out.every((option) => option.kind === 'catalog' && option.provider === 'telnyx')).toBe(true);
    expect(out[0].value).toBe('Telnyx.KokoroTTS.af_heart');
    expect(out[0].label).toBe('af_heart');
    expect(out[1].value).toBe(DEFAULT_AGENT_VOICE);
    expect(out[1].label.length).toBeGreaterThan(0);
  });

  it('tolera entradas nulas y lista vacía', () => {
    expect(mapCatalogVoices(null)).toEqual([]);
    expect(mapCatalogVoices([null as unknown as TtsVoice])).toEqual([]);
  });
});

describe('mapClonesToOptions', () => {
  it('compone Telnyx.<modelo>.<voice> y marca cloneId', () => {
    const [option] = mapClonesToOptions([
      {
        id: 'uuid-1',
        name: 'Voz Marca',
        provider: 'telnyx',
        model_id: 'Qwen3TTS',
        provider_voice_id: 'pv-1',
        status: 'active',
      },
    ]);
    expect(option.value).toBe('Telnyx.Qwen3TTS.pv-1');
    expect(option.kind).toBe('clone');
    expect(option.cloneId).toBe('uuid-1');
    expect(option.label).toBe('Voz Marca');
  });

  it('usa el id del clon cuando falta provider_voice_id y descarta Minimax', () => {
    const out = mapClonesToOptions([
      { id: 'uuid-2', provider: 'telnyx', model_id: 'Ultra' },
      { id: 'uuid-3', provider: 'minimax' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].value).toBe('Telnyx.Ultra.uuid-2');
    expect(out[0].label).toBe('Clon uuid-2');
  });
});

describe('isValidVoiceValue', () => {
  it('acepta identificadores Telnyx y rechaza basura', () => {
    expect(isValidVoiceValue('Telnyx.KokoroTTS.af_heart')).toBe(true);
    expect(isValidVoiceValue(DEFAULT_AGENT_VOICE)).toBe(true);
    expect(isValidVoiceValue('con espacios')).toBe(false);
    expect(isValidVoiceValue('ab')).toBe(false);
    expect(isValidVoiceValue(`Telnyx.${'x'.repeat(200)}`)).toBe(false);
    expect(isValidVoiceValue('voz;rm')).toBe(false);
  });
});

describe('validateCloneFile', () => {
  it('acepta WAV/MP3 dentro del límite', () => {
    expect(validateCloneFile({ type: 'audio/wav', size: 1024 })).toBeNull();
    expect(validateCloneFile({ type: 'audio/mpeg', size: 4 * 1024 * 1024 })).toBeNull();
  });

  it('rechaza formatos no de audio, vacíos y >5MB', () => {
    expect(validateCloneFile({ type: 'image/png', size: 100 })).toMatch(/Formato/);
    expect(validateCloneFile({ type: 'audio/wav', size: 0 })).toMatch(/vacío/);
    expect(validateCloneFile({ type: 'audio/wav', size: CLONE_MAX_BYTES + 1 })).toMatch(/5 MB/);
  });
});

describe('buildPreviewText y catálogo fallback', () => {
  it('el preview es corto e incluye el nombre del agente', () => {
    const text = buildPreviewText('Clínica Andes');
    expect(text).toContain('Clínica Andes');
    expect(text.length).toBeLessThanOrEqual(200);
    expect(buildPreviewText(null)).not.toContain('undefined');
  });

  it('el fallback siempre ofrece voces válidas', () => {
    expect(FALLBACK_CATALOG.length).toBeGreaterThan(0);
    for (const option of FALLBACK_CATALOG) {
      expect(isValidVoiceValue(option.value)).toBe(true);
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.kind).toBe('catalog');
    }
  });
});
