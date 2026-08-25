import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tiendaId = searchParams.get('state');

  if (!code || !tiendaId) {
    return NextResponse.redirect(new URL('/dashboard?calendar=error', request.url));
  }

  // ℹ️ El módulo de Google Calendar ya fue depurado de la infraestructura de Upway.
  // Redirigimos de forma limpia al dashboard sin intentar actualizar columnas inexistentes.
  console.log(`ℹ️ [Upway] Callback de Google recibido para la tienda ${tiendaId} (módulo deprecado).`);

  return NextResponse.redirect(new URL('/dashboard?calendar=success', request.url));
}