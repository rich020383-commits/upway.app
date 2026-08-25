import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardGateway() {
  const session = await getServerSession(); 
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tiendas: true }
  });

  const tienda = user?.tiendas?.[0];

  // 🔥 VALIDACIÓN REAL: ¿La tienda tiene un nombre configurado o sigue siendo el registro vacío de Google Auth?
  // (Si en tu base de datos el campo se llama diferente, ej: 'reglas' o 'prompt', ajústalo aquí)
  const estaConfigurada = tienda && tienda.nombre && tienda.nombre.trim() !== '';

  if (!estaConfigurada) {
    // 🟡 Si la tienda está vacía o recién creada por Google sin nombre, va al onboarding
    redirect('/dashboard/onboarding/activacion');
  } else {
    // 🟢 Si ya tiene nombre y configuración real, va directo al Centro de Mando
    redirect('/dashboard/bots');
  }
}