import { cookies } from 'next/headers';

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

  try {
    const payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8')) as AppSession;
    return payload;
  } catch {
    return null;
  }
}

export async function signIn(user: AppSession['user']) {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({ user })).toString('base64');
  cookieStore.set('upway-session', payload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('upway-session');
}
