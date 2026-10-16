import { NextResponse } from 'next/server';
import { listSessionIds, getSession, getPublicSnapshot } from '@/lib/demo/store';

export async function GET() {
  const ids = listSessionIds();
  const sessions = ids.map((id) => {
    const s = getSession(id);
    return s ? {
      id,
      phone: s.phone,
      status: s.status,
      conversationId: s.conversationId,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
    } : null;
  }).filter(Boolean);

  return NextResponse.json({
    total: sessions.length,
    sessions,
    hint: 'Si ves sesiones con status "waiting" y llamaste pero no cambia a "live", el webhook de Telnyx no está llegando a este endpoint. Verifica en el portal de Telnyx: Phone Numbers -> +576019177737 -> Webhook URL debe ser https://upway.business/api/voice/webhooks',
  });
}