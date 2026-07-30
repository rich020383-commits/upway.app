import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { authenticateUser } from '@/lib/app-state';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
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
