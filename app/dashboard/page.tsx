import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardGateway() {
  // 1. Validamos sesión
  const session = await getServerSession(); 
  if (!session?.user?.email) {
    redirect('/login');
  }

  // 2. Buscamos usuario y sus tiendas
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tiendas: true }
  });

  const tienda = user?.tiendas?.[0];

  // 3. SEMÁFORO INTELIGENTE: Verificamos si la tienda es real o solo un registro vacío/retroactivo de Google Auth
  const esTiendaConfigurada = tienda && tienda.systemPrompt && tienda.systemPrompt.trim() !== '';

  if (!esTiendaConfigurada) {
    // 🟡 Si no tiene tienda o está vacía (creada por Google sin configurar), va al onboarding
    redirect('/dashboard/onboarding/activacion');
  } else {
    // 🟢 Si ya tiene un agente configurado de verdad, va al Centro de Mando
    redirect('/dashboard/bots');
  }
}