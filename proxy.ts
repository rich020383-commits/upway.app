import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

const billingGatePages = ['/dashboard/billing'];

// 🛡️ withAuth maneja la redirección a /login automáticamente si no hay sesión
export default withAuth(
  function proxy(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;

    // 🛡️ Redirección explícita para rutas de health sin sesión
    const token = request.nextauth.token;
    if (!token && pathname.startsWith('/health/')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('segment', 'health');
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
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
    const redirectUrl = new URL('/dashboard/billing', request.url);
    redirectUrl.searchParams.set('state', effectiveState);
    return NextResponse.redirect(redirectUrl);
  },
  {
    pages: { signIn: '/login' },
  }
);

// Configuración de las rutas que interceptará este archivo
export const config = {
  matcher: ['/dashboard/:path*', '/health/:path*'],
};