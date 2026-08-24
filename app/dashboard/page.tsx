import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardGateway() {
  // 1. Validamos sesión del lado del servidor de forma ultra rápida
  const session = await getServerSession(); 
  if (!session?.user?.email) {
    redirect('/login');
  }

  // 2. Buscamos si el usuario ya tiene una tienda registrada en Prisma
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tiendas: true }
  });

  // 3. SEMÁFORO INTELIGENTE DE UX
  if (!user?.tiendas || user.tiendas.length === 0) {
    // 🟡 Si es nuevo y no tiene tienda, lo mandamos al flujo de activación
    redirect('/dashboard/onboarding/activacion');
  } else {
    // 🟢 Si ya tiene tienda configurada, lo mandamos derecho a tu Centro de Mando (Bots)
    redirect('/dashboard/bots');
  }
}