import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'La base de datos aún no está configurada.' }, { status: 503 });
    }

    const { prisma } = await import('@/lib/prisma');
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo.' }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 });
  }
}
