import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 🚀 SEGURIDAD APAGADA TEMPORALMENTE PARA LA REVISIÓN DE META
  // Dejamos pasar todo el tráfico sin validar la cookie 'upway-session'
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};