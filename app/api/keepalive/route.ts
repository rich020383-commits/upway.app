import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Hacemos una consulta minúscula a la base de datos
    // Solo para decirle a Neon: "¡Hey, seguimos trabajando!"
    await prisma.user.findFirst({
      select: { id: true }
    });
    
    return NextResponse.json({ 
      status: 'ok', 
      mensaje: 'Neon está despierto y al 100% 🟢' 
    });
  } catch (error) {
    console.error('Error despertando a Neon:', error);
    return NextResponse.json({ error: 'Fallo de conexión' }, { status: 500 });
  }
}