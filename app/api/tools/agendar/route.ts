import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'La herramienta de agendamiento por Vapi ha sido deprecada. Las citas se gestionan vía Telnyx y Agenda Nativa Upway.',
      status: 'deprecated',
    },
    { status: 410 }
  );
}