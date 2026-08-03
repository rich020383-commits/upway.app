import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inicializamos Prisma para conectarnos a Neon
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    // 1. Buscamos si el usuario ya existe en NEON (Base de datos real)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo.' }, { status: 409 });
    }

    // 2. Encriptamos la contraseña por seguridad (nunca guardar en texto plano)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Creamos el usuario en NEON usando Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Devolvemos los datos del nuevo usuario (sin la contraseña)
    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta en la base de datos.' }, { status: 500 });
  }
}