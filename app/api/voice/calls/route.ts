import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { createOutboundCall, isTelnyxCallReady, missingTelnyxCallEnv, telnyxNotReadyMessage } from '@/lib/telnyx/client';
import { checkVoiceRateLimit, voiceRateLimitResponse } from '@/lib/telnyx/rate-limit';
import { CALL_CONSENT_REQUIRED_MESSAGE } from '@/lib/telnyx/voice-consent';
import { voiceCapabilityDenied } from '@/lib/voice-access';

export const maxDuration = 30;

const callSchema = z.object({
  tiendaId: z.string().min(1),
  to: z.string().regex(/^\+\d{7,15}$/, 'El destino debe ser E.164 (+573...)'),
  // Consentimiento previo del destino. Opcional en el schema para poder
  // responder SIEMPRE el mensaje legal y no un "Required" generico de zod.
  consent: z.boolean().optional(),
});

// POST /api/voice/calls — llamada de prueba outbound desde el número Telnyx de la tienda.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
  if (user.id === 'meta-reviewer') {
    return NextResponse.json({ error: 'Revisor externo sin acceso a voz' }, { status: 403 });
  }
  // Una llamada marca un teléfono real y cuesta minutos: solo con el caso aprobado.
  const callDenied = await voiceCapabilityDenied(user.id, 'call');
  if (callDenied) {
    return NextResponse.json({ error: callDenied.error }, { status: callDenied.status });
  }

  // Freno de cuota antes de tocar Telnyx: cada intento aqui es dinero y una
  // marcacion real a un telefono. Se aplica por usuario ya autenticado.
  const rate = checkVoiceRateLimit('call', user.id);
  if (!rate.allowed) return voiceRateLimitResponse('call', rate);

  const parsed = callSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }
  if (parsed.data.consent !== true) {
    return NextResponse.json({ error: CALL_CONSENT_REQUIRED_MESSAGE }, { status: 400 });
  }
  const tienda = await prisma.tienda.findFirst({
    where: { id: parsed.data.tiendaId, userId: user.id },
  });
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  // Marcar sí necesita la Call Control App y un número emisor. El número
  // dedicado de la tienda exime de la env global (mismo criterio que
  // createOutboundCall: `from` explícito > default global).
  if (!isTelnyxCallReady(tienda.telnyxPhoneNumber)) {
    return NextResponse.json(
      { error: telnyxNotReadyMessage(missingTelnyxCallEnv(tienda.telnyxPhoneNumber), 'llamada') },
      { status: 503 }
    );
  }
  try {
    const res = await createOutboundCall({
      to: parsed.data.to,
      from: tienda.telnyxPhoneNumber ?? undefined,
      assistantId: tienda.telnyxAssistantId ?? undefined,
      clientState: tienda.id,
    });
    await prisma.llamadaLog.create({
      data: {
        tiendaId: tienda.id,
        callSessionId: (res?.data?.id as string | undefined) ?? `manual-${Date.now()}`,
        direction: 'outbound',
        durationMinutes: 0,
        telnyxCost: 0,
        upwayBilledCost: 0,
        status: 'initiated',
      },
    }).catch(() => undefined);
    // Evidencia del consentimiento: queda en el log del servidor con usuario,
    // tienda y destino. El aviso al destinatario lo da el asistente al contestar.
    console.info('[voice] llamada saliente con consentimiento atestiguado', {
      userId: user.id,
      tiendaId: tienda.id,
      to: parsed.data.to,
    });
    return NextResponse.json({ ok: true, call: res?.data ?? res });
  } catch (err) {
    console.error('[telnyx] outbound call failed', err);
    return NextResponse.json({ error: 'El servicio de voz de Upway no pudo iniciar la llamada' }, { status: 502 });
  }
}
