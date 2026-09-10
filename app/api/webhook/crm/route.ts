import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'La integración de herramientas CRM de Vapi ha sido deprecada. El sistema migró a Telnyx.',
      status: 'deprecated',
    },
    { status: 410 }
  );
}