import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { buildVoiceGreeting } from '@/lib/telnyx/voice-consent';
import {
  isTelnyxVoiceReady,
  missingTelnyxVoiceEnv,
  telnyxNotReadyMessage,
  upsertAssistantForTienda,
} from '@/lib/telnyx/client';
import { DEFAULT_AGENT_VOICE } from '@/lib/telnyx/voices';
import { buildPromptFromAnswers, VERTICAL_LABEL } from '@/lib/onboarding/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

const E164 = /^\+\d{7,15}$/;

const activateSchema = z.object({
  /** Segmento del wizard: 'inmobiliaria' | 'center'. */
  segment: z.enum(['inmobiliaria', 'center']),
  /** Ref del caso (UPW-ONB-...). Es el identificador que aparece en "Mi caso". */
  caseRef: z.string().trim().min(6).max(40),
  /** DID comprado en Telnyx, en E.164. */
  telefono: z.string().trim().regex(E164, 'El teléfono debe ser E.164 (+57300...)'),
  /** Nombre del agente. Si no viene, se deriva del negocio. */
  agentName: z.string().trim().min(2).max(80).optional(),
  /** Instrucciones: si no vienen, se arma con las respuestas del wizard. */
  systemPrompt: z.string().trim().min(10).max(8000).optional(),
  /** Voz a asignar. Si no viene, la predeterminada verificada. */
  voice: z.string().trim().min(3).max(140).optional(),
  /**
   * Deja el caso en APPROVED en vez de llevarlo hasta ACTIVE.
   *
   * Existe por una razón concreta: aprobar el caso es un acto comercial (el
   * cliente pagó) y prender la voz es un acto técnico (el número ya responde).
   * Si el DID todavía no está listo, el negocio se aprueba igual y la voz se
   * enciende después, sin bloquear a quien ya pagó.
   */
  soloAprobar: z.boolean().optional(),
});

/**
 * Compara el token de la cabecera con el del entorno en tiempo constante.
 *
 * Si `UPWAY_INTERNAL_TOKEN` no está configurado la ruta queda **deshabilitada**
 * y responde 503: nunca abierta. Un "si no hay token, pasa" sería la peor
 * versión de este endpoint, porque permite aprobar y encender cualquier caso.
 */
function autorizado(req: NextRequest): boolean {
  const esperado = process.env.UPWAY_INTERNAL_TOKEN;
  if (!esperado) return false;
  const recibido = req.headers.get('x-upway-internal-token') ?? '';
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Etiqueta legible de una voz, para no dejar el id crudo en la interfaz. */
function vozLabelDe(voice: string): string {
  const partes = voice.split('.');
  if (partes.length >= 3) {
    return `${partes[1]} · ${partes.slice(2).join('.')}`;
  }
  return partes.slice(1).join('.') || voice;
}


/**
 * POST /api/vertical/activate — el paso que hoy no existía.
 *
 * Health tiene su propio ciclo (`/api/health/activate` + `/api/health/approvals`),
 * pero las verticales no: nada en el código podía llevar su caso de
 * PENDING_REVIEW a APPROVED. Y como el panel de operaciones y el gate de voz
 * se abren exactamente en APPROVED, un cliente de Center o Inmobiliaria no
 * podía ver su panel, ni clonar su voz, ni encender su asistente, ni recibir
 * llamadas. Este endpoint es el puente.
 *
 * Hace, en este orden:
 *   1. Aprueba el caso.
 *   2. Asigna el DID a la sede y fija su segmento real.
 *   3. Crea el asistente de voz con el guion y la voz indicados.
 *   4. Deja la sede lista y marca el caso ACTIVE.
 *
 * Reintentarlo no duplica el asistente: `upsertAssistantForTienda` actualiza el
 * existente en la sede.
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req)) {
    const sinConfigurar = !process.env.UPWAY_INTERNAL_TOKEN;
    console.error(
      `[vertical/activate] petición rechazada${sinConfigurar ? ' (falta UPRWAY_INTERNAL_TOKEN)' : ''}`
    );
    return NextResponse.json(
      {
        error: sinConfigurar
          ? 'Activación deshabilitada: falta configurar UPRWAY_INTERNAL_TOKEN en el servidor.'
          : 'Token interno inválido.',
      },
      { status: sinConfigurar ? 503 : 401 }
    );
  }

  const parsed = activateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }
  const { segment, caseRef, telefono, soloAprobar } = parsed.data;

  const sesion = await prisma.verticalOnboardingSession.findFirst({
    where: { caseRef, segment },
  });
  if (!sesion) {
    return NextResponse.json(
      { error: `No hay ningún caso con ref ${caseRef} en el segmento ${segment}.` },
      { status: 404 }
    );
  }
  if (sesion.status === 'ACTIVE') {
    return NextResponse.json({ ok: true, yaActivo: true, status: sesion.status });
  }

  // 1. Aprobar primero y de forma durable: si algo más falla, el caso queda
  // aprobado y el reintento continúa desde acá, en vez de dejar al cliente que
  // ya pagó sin producto.
  await prisma.verticalOnboardingSession.update({
    where: { id: sesion.id },
    data: { status: 'APPROVED' },
  });

  const tienda = await prisma.tienda.findFirst({ where: { userId: sesion.userId } });
  if (!tienda) {
    return NextResponse.json(
      { error: 'El usuario del caso no tiene sede operativa. Revisá el registro.' },
      { status: 404 }
    );
  }

  if (soloAprobar) {
    return NextResponse.json({
      ok: true,
      soloAprobar: true,
      status: 'APPROVED',
      message: `Caso ${caseRef} aprobado. La voz se enciende cuando el número esté listo.`,
    });
  }

  if (!isTelnyxVoiceReady()) {
    return NextResponse.json(
      {
        ok: true,
        status: 'APPROVED',
        warning: telnyxNotReadyMessage(missingTelnyxVoiceEnv()),
        message: 'El caso quedó aprobado, pero no se pudo encender la voz: falta configuración.',
      },
      { status: 207 }
    );
  }


  const negocio = tienda.nombre;
  const agentName = parsed.data.agentName ?? `Agente · ${negocio}`.slice(0, 80);
  const systemPrompt =
    parsed.data.systemPrompt ?? buildPromptFromAnswers(segment, sesion.answers);
  const voice = parsed.data.voice ?? DEFAULT_AGENT_VOICE;

  // El saludo encabeza SIEMPRE con el aviso de grabación y tratamiento de datos
  // (Ley 1581). No se puede saltar por descuido desde este endpoint.
  const greeting = buildVoiceGreeting({ agentName, businessName: negocio });

  try {
    const telnyxRes = await upsertAssistantForTienda({
      name: `${agentName} · ${negocio}`.slice(0, 60),
      greeting,
      instructions: `${VERTICAL_LABEL[segment]} · ${negocio}\n${systemPrompt}`,
      voice,
    });
    const assistantId = (telnyxRes?.data?.id ?? telnyxRes?.id) as string | undefined;

    await prisma.tienda.update({
      where: { id: tienda.id },
      data: {
        segment,
        nombre: negocio,
        telnyxPhoneNumber: telefono,
        telnyxAssistantId: assistantId ?? tienda.telnyxAssistantId,
        agentName,
        systemPrompt,
        agentVoice: voice,
        agentVoiceLabel: vozLabelDe(voice),
        isTelnyxActive: true,
      },
    });

    await prisma.verticalOnboardingSession.update({
      where: { id: sesion.id },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json({
      ok: true,
      status: 'ACTIVE',
      vertical: segment,
      telefono,
      assistantId: assistantId ?? null,
      agentName,
      voice,
    });
  } catch (err) {
    // El caso ya quedó APPROVED a propósito: el cliente pagó y la voz se
    // reintenta sin volver a pasar por una aprobación comercial.
    console.error('[vertical/activate] no se pudo prender la voz', { caseRef, segment, error: err });
    return NextResponse.json(
      {
        error:
          'El caso quedó aprobado, pero no se pudo encender la voz. Reintentá: el caso ya no necesita aprobación.',
        status: 'APPROVED',
      },
      { status: 502 }
    );
  }
}
