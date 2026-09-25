import { NextResponse } from 'next/server';

/**
 * Logout real: NextAuth guarda la sesión en cookies, así que limpiarlas es lo
 * que efectivamente cierra la sesión en el servidor. Antes esta ruta
 * respondía `{ ok: true }` sin borrar nada (placeholder): cualquiera que la
 * consumiera creía haber cerrado sesión y seguía autenticado.
 */
const SESSION_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
];

function clearSessionCookies(response: NextResponse) {
  for (const name of SESSION_COOKIES) {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: name.startsWith('__'),
    });
  }
  return response;
}

export async function GET() {
  return clearSessionCookies(new NextResponse(null, { status: 204 }));
}

export async function POST() {
  return clearSessionCookies(NextResponse.json({ ok: true, signedOut: true }));
}
