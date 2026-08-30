import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'upway-session';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;

function signPayload(payloadBase64: string): string {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET o NEXTAUTH_SECRET no está configurado');
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('base64url');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export type AppSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

export async function auth(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('upway-session')?.value;

  if (!sessionCookie) {
    return null;
  }

  if (!SESSION_SECRET) {
    console.error('auth(): falta SESSION_SECRET/NEXTAUTH_SECRET; no se puede verificar la sesión');
    return null;
  }

  try {
    // Formato del cookie: "<payloadBase64>.<hmac>"
    const separatorIndex = sessionCookie.lastIndexOf('.');
    if (separatorIndex === -1) return null;

    const payloadBase64 = sessionCookie.slice(0, separatorIndex);
    const signature = sessionCookie.slice(separatorIndex + 1);

    const expectedSignature = signPayload(payloadBase64);
    if (!timingSafeEqualStr(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8')) as AppSession;
    if (!payload?.user?.id) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signIn(user: AppSession['user']) {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({ user })).toString('base64');
  cookieStore.set(SESSION_COOKIE, `${payload}.${signPayload(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
