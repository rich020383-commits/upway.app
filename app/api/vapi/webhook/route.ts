import { NextResponse } from 'next/server';

export async function POST() {
  // Endpoint legado de Vapi desactivado en favor del nuevo motor Telnyx.
  // Responde 200 OK vacío para descartar eventos pendientes sin errores de red.
  return new NextResponse(null, { status: 200 });
}