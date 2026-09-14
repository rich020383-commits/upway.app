import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const cookies = request.cookies.getAll();
  const sessionCookie = cookies.find(
    (c) => c.name.includes('session') || c.name.includes('token') || c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
  );

  return NextResponse.json({
    hasToken: !!token,
    hasSessionCookie: !!sessionCookie,
    cookieName: sessionCookie?.name ?? null,
    cookieValue: sessionCookie?.value ? sessionCookie.value.substring(0, 20) + '...' : null,
    tokenId: token?.id ?? null,
    tokenEmail: token?.email ?? null,
    tokenRole: token?.role ?? null,
    tokenKeys: token ? Object.keys(token) : [],
    nextauthSecret: process.env.NEXTAUTH_SECRET ? 'CONFIGURED' : 'MISSING',
  });
}
