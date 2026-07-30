import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { verifyPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'La base de datos aún no está configurada.' }, { status: 503 });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.password) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    await signIn({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
