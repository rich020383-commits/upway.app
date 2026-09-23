import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

// Rutas que pueden verse con la facturación en cualquier estado: es donde el
// cliente revisa el estado de su cuenta. Antes apuntaba a /dashboard/billing,
// que se retiró junto con el panel viejo.
const billingGatePages = ['/health/settings'];

// 🛡️ withAuth maneja la redirección a /login automáticamente si no hay sesión
export default withAuth(
  function proxy(request: NextRequestWithAuth) {
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

// Configuración de las rutas que interceptará este archivo.
// /dashboard/* ya no vive aquí: next.config.ts lo redirige 301 a /health
// antes de que corra el middleware.
export const config = {
  matcher: ['/health/:path*'],
};