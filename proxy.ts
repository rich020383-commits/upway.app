import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

const billingGatePages = ['/dashboard/billing'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedArea = pathname.startsWith('/dashboard') || pathname.startsWith('/health');

  if (!isProtectedArea) {
    return NextResponse.next();
  }

  // 🛡️ 1. Verificación de sesión criptográfica vía JWT de NextAuth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ 2. Control de facturación (Billing Gate)
  if (billingGatePages.includes(pathname)) {
    return NextResponse.next();
  }

  const tokenState = typeof token.accessState === 'string' ? token.accessState : null;
  const fallbackState = typeof token.billingState === 'string' ? token.billingState : null;
  const effectiveState = resolveBillingState(
    tokenState ?? fallbackState ?? process.env.DEFAULT_BILLING_STATE ?? 'trial'
  );

  if (billingStateMeta[effectiveState]?.canAccessDashboard) {
    return NextResponse.next();
  }

  const redirectUrl = new URL('/dashboard/billing', request.url);
  redirectUrl.searchParams.set('state', effectiveState);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/health/:path*'],
};
