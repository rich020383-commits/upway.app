import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import {
  generateSpeech,
  isTelnyxVoiceReady,
  listTtsVoices,
  missingTelnyxVoiceEnv,
  telnyxNotReadyMessage,
} from '@/lib/telnyx/client';
import { FALLBACK_CATALOG, isValidVoiceValue, mapCatalogVoices, type VoiceOption } from '@/lib/telnyx/voices';

export const maxDuration = 30;

/**
 * Demo de voz PUBLICA de la landing (`/api/voice/demo`).
 *
 * GET  → catálogo de voces para que el visitante elija (sin sesión).
 * POST → sintetiza la frase que escribe el visitante (sin sesión).
 *
 * Por qué no lleva sesión: es el escaparate de venta — el visitante tiene que
 * poder OÍR el producto antes de registrarse. Lo que sí lleva es freno por IP
 * (`checkRateLimit` con `getClientIp`), porque cada síntesis gasta dinero real
 * en el proveedor de voz: sin límite un script agotaría la cuota con el botón
 * de "Escuchar". Igual que en el resto de `/api/voice/*`, el contador vive en
 * memoria del proceso (limitación aceptada del rate limit actual).
 *
 * El texto se limita a 140 caracteres: suficiente para que el visitante escuche
 * su frase y corta cualquier intento de usar el endpoint como servicio de
 * síntesis masiva.
 *
 * CONFIDENCIALIDAD: la respuesta no expone el identificador del proveedor
 * (mismo criterio que `/api/voice/voices`). Los mensajes de error son
 * genéricos en español.
 */

const demoSchema = z.object({
  voice: z.string().trim().min(3).max(140).refine(isValidVoiceValue, 'Identificador de voz inválido'),
  text: z.string().trim().min(3).max(140, 'La frase de la demo no supera los 140 caracteres'),
});

/** Ventana de la demo: por IP y por hora. */
const DEMO_RULE = { limit: 8, windowMs: 60 * 60 * 1000 } as const;

/** Catálogo público: por IP y por hora (es una llamada al proveedor). */
const DEMO_CATALOG_RULE = { limit: 30, windowMs: 60 * 60 * 1000 } as const;

/* El catálogo completo cambia cada tanto, no en cada request. Cacheamos 10
   minutos en memoria del proceso: la demo pública NO debe costar dos llamadas
   al proveedor por visita (rate limit + latencia para el visitante). Si falla,
   se sirve FALLBACK_CATALOG, que es la lista verificada contra la API. */
let catalogCache: { at: number; data: VoiceOption[] } | null = null;
const CATALOG_TTL_MS = 10 * 60 * 1000;

/** El proveedor viaja en las opciones internas y nunca en la respuesta. */
function sinProveedor(options: VoiceOption[]): Array<Record<string, unknown>> {
  return options.map((opcion) => {
    const copia: Record<string, unknown> = { ...opcion };
    delete copia.provider;
    return copia;
  });
}

async function catalogoDemo(): Promise<VoiceOption[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.data;

  let voices: VoiceOption[] = [];
  if (isTelnyxVoiceReady()) {
    try {
      const res = (await listTtsVoices('telnyx')) as { voices?: unknown[] };
      voices = mapCatalogVoices((res?.voices ?? []) as never[]);
    } catch {
      // Catálogo inaccesible: se cae al fallback verificado, nunca a lista vacía.
      voices = [];
    }
  }
  if (voices.length === 0) voices = FALLBACK_CATALOG;

  // La landing es en español: el catálogo entero (más de mil) es inmanejable
  // como lista de chips. Se PRIORIZA lo que el visitante colombiano reconoce
  // (colombianas, luego resto del español) y se corta en 24. No se filtran los
  // demás idiomas: con el catálogo real la lista ya se llena en español antes
  // del corte, y con el fallback corto se sirve completo (todas verificadas).
  const es = (v: VoiceOption) => (v.language ?? '').toLowerCase().startsWith('es');
  const esCo = (v: VoiceOption) => (v.language ?? '').toLowerCase() === 'es-co';
  const ordenadas = [
    ...voices.filter(esCo),
    ...voices.filter((v) => es(v) && !esCo(v)),
    ...voices.filter((v) => !es(v)),
  ];

  const data = ordenadas.slice(0, 24);
  catalogCache = { at: Date.now(), data };
  return data;
}

/**
 * Solo para pruebas: limpia el caché de 10 minutos del catálogo público.
 * Mismo patrón que `resetRateLimitStore` — los tests comparten proceso y,
 * sin esto, la prueba del fallback recibiría el catálogo cacheado del test
 * anterior en lugar del catálogo verificado.
 */
export function resetDemoCatalogCache(): void {
  catalogCache = null;
}


export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`voice-demo-catalog:${ip}`, DEMO_CATALOG_RULE);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  const voices = await catalogoDemo();
  const listo = isTelnyxVoiceReady();
  return NextResponse.json(
    { voices: sinProveedor(voices), ready: listo },
    {
      status: 200,
      headers: {
        ...rateLimitHeaders(rate),
        'Cache-Control': 'public, max-age=600',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // El freno corre ANTES de tocar el proveedor: sin eso, cada request
  // malformado costaría una llamada pagada en el peor caso.
  const rate = checkRateLimit(`voice-demo:${ip}`, DEMO_RULE);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          'Se agotaron las muestras de voz de esta hora. Un asesor puede mostrarte el catálogo completo.',
      },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  if (!isTelnyxVoiceReady()) {
    return NextResponse.json(
      { error: telnyxNotReadyMessage(missingTelnyxVoiceEnv()) },
      { status: 503, headers: rateLimitHeaders(rate) }
    );
  }

  const parsed = demoSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400, headers: rateLimitHeaders(rate) }
    );
  }
  const { voice, text } = parsed.data;

  try {
    const audio = await generateSpeech({ voice, text });
    return new NextResponse(audio.bytes, {
      headers: {
        'Content-Type': audio.contentType,
        'Cache-Control': 'no-store',
        ...rateLimitHeaders(rate),
      },
    });
  } catch (err) {
    // Mismo diagnóstico que el preview autenticado: si no se registra QUÉ voz
    // falló, un 90103 en producción no da ninguna pista.
    console.error('[voice] demo failed', { voice, error: err });
    return NextResponse.json(
      { error: 'Esta voz no pudo generar la muestra ahora. Prueba con otra de la lista.' },
      { status: 502, headers: rateLimitHeaders(rate) }
    );
  }
}
