import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'El servicio de aprovisionamiento de Vapi ha sido deprecado. Upway opera con infraestructura de voz nativa de Telnyx.',
      status: 'deprecated',
    },
    { status: 410 }
  );
}