import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Hacemos una consulta minúscula a la base de datos
    // Solo para decirle a Aiven: "¡Hey, seguimos trabajando!"
    //
    // Ojo: el plan trial de Aiven apaga el servicio por inactividad. Llamar a
    // esta ruta lo mantiene despierto (útil antes de una demo), pero consume
    // horas del trial: no la dejes en ningún cron permanente.
    await prisma.user.findFirst({
      select: { id: true }
    });
    
    return NextResponse.json({ 
      status: 'ok', 
      mensaje: 'Aiven responde y está al 100% 🟢' 
    });
  } catch (error) {
    console.error('Error consultando la base de datos (Aiven):', error);
    return NextResponse.json({ error: 'Fallo de conexión' }, { status: 500 });
  }
}