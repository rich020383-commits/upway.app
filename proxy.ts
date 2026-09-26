import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

// Rutas que pueden verse con la facturación en cualquier estado: es donde el
// cliente revisa el estado de su cuenta. Antes apuntaba a /dashboard/billing,
// que se retiró junto con el panel viejo.
const billingGatePages = ['/health/settings'];

/**
 * Fuerza un único host canónico.
 *
 * `NEXTAUTH_URL` define el host donde NextAuth emite la cookie de sesión. El
 * sitio responde en dos: con y sin `www`. Entrar por el que NO coincide con
 * `NEXTAUTH_URL` deja al navegador sin cookie, así que el login responde "ok",
 * la navegación avanza, la primera API devuelve 401 y la pantalla vuelve a
 * pedir iniciar sesión: un bucle infinito sin ningún error útil.
 *
 * El host canónico se LEE de `NEXTAUTH_URL` y no se escribe aquí, para que si
 * esa variable cambia en Render la redirección la siga sola y no puedan quedar
 * desalineados.
 *
 * 308 y no 307/302: preserva método y cuerpo, así un POST de la API no se
 * convierte en GET al pasar por la redirección.
 *
 * Se exporta para poder probarlo directamente.
 */
export function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const configurado = process.env.NEXTAUTH_URL;
  if (!configurado) return null;

  let canonico: string;
  let protocolo: string;
  try {
    const base = new URL(configurado);
    canonico = base.host.toLowerCase();
    protocolo = base.protocol;
  } catch {
    // Una URL inválida en el entorno no debe dejar el sitio inaccesible.
    console.error('[proxy] NEXTAUTH_URL no es una URL válida; se sirve tal cual');
    return null;
  }

  const actual = request.nextUrl.host.toLowerCase();
  if (actual === canonico) return null;

  // Solo se canonicalizan hosts de producción. En local (`localhost`, redes de
  // pruebas) redirigir rompería el desarrollo.
  const esProduccion =
    actual === 'upway.business' || actual.endsWith('.upway.business') || actual === canonico;
  if (!esProduccion) return null;

  const destino = `${protocolo}//${canonico}${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(destino, 308);
}

// 🛡️ withAuth maneja la redirección a /login automáticamente si no hay sesión.
// Esta lógica se mantiene igual que antes y SOLO corre para /health/*.
const healthProxy = withAuth(
  function proxyHealth(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;

    // 🛡️ Redirección explícita para rutas de health sin sesión
    // NOTA: Excluir /api/health/* para que las APIs funcionen sin depender de cookies
    const token = request.nextauth.token;
    const isApiRoute = pathname.startsWith('/api/health/');
    if (!token && pathname.startsWith('/health/') && !isApiRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('segment', 'health');
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Permitir rutas API de health sin sesión (las APIs validan datos server-side)
    if (isApiRoute) {
      return NextResponse.next();
    }

    // 🛡️ Control de facturación (Billing Gate)
    if (billingGatePages.includes(pathname)) {
      return NextResponse.next();
    }

    const tokenState = typeof token?.accessState === 'string' ? token.accessState : null;
    const fallbackState = typeof token?.billingState === 'string' ? token.billingState : null;
    const effectiveState = resolveBillingState(
      tokenState ?? fallbackState ?? process.env.DEFAULT_BILLING_STATE ?? 'trial'
    );

    if (billingStateMeta[effectiveState]?.canAccessDashboard) {
      return NextResponse.next();
    }

    // Redirección si el estado de facturación no permite el acceso
    const redirectUrl = new URL('/health/settings', request.url);
    redirectUrl.searchParams.set('state', effectiveState);
    return NextResponse.redirect(redirectUrl);
  },
  {
    pages: { signIn: '/login' },
  }
);

/**
 * Proxy único: canonicaliza el host en todo el sitio y aplica la lógica de
 * sesión y facturación solo a /health.
 *
 * El matcher antes era `/health/:path*`. Se amplió a todo el sitio para poder
 * corregir el host, pero la parte que envuelve con `withAuth` se sigue invoking
 * únicamente para /health: aplicarla a las landings públicas mandaría a un
 * visitante sin sesión a /login, que es justo lo contrario de lo que queremos.
 */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const redirect = canonicalHostRedirect(request);
  if (redirect) return redirect;

  if (request.nextUrl.pathname.startsWith('/health')) {
    // `withAuth` declara que recibe un NextRequest ya aumentado con `nextauth`,
    // pero en realidad es él quien lo adjunta tras leer el token: por eso el
    // cast es correcto y no una mentira de tipos. El evento se pasa igual,
    // porque mantiene la firma (request, event).
    return healthProxy(request as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  // Se dejan fuera los estáticos: no llevan cookie de sesión, así que no les
  // afecta y se ahorra un redirect por cada imagen, fuente o script.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
