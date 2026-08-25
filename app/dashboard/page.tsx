import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Bot, Settings, LayoutDashboard, ArrowRight, Sparkles } from 'lucide-react';

export default async function DashboardGateway() {
  // 1. Validamos la sesión
  const session = await getServerSession(); 
  if (!session?.user?.email) {
    redirect('/login');
  }

  // 2. Buscamos al usuario y sus tiendas
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tiendas: true }
  });

  // 3. LÓGICA DE ENRUTAMIENTO: Si es nuevo, lo obligamos a configurar
  if (!user?.tiendas || user.tiendas.length === 0) {
    redirect('/dashboard/onboarding/activacion');
  }

  // 4. SI ES USUARIO VIEJO: Mostramos la pantalla de decisión
  const tiendaActual = user.tiendas[0];

  return (
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#19C8E8] opacity-[0.03] blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#19C8E8] mb-6">
            <Sparkles className="h-4 w-4"/> Hola de nuevo, {user.name || 'Líder'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            ¿Qué deseas hacer con <span className="text-[#19C8E8]">{tiendaActual.nombre}</span>?
          </h1>
          <p className="text-[#8994A6] text-lg">Selecciona tu área de trabajo para continuar.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* OPCIÓN 1: IR AL PANEL (OPERACIÓN DIARIA) */}
          <Link href="/dashboard/bots" className="group block">
            <div className="h-full rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl transition-all hover:border-[#19C8E8]/50 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-[#19C8E8] h-6 w-6" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#19C8E8]/10 text-[#19C8E8] mb-6 border border-[#19C8E8]/20">
                <LayoutDashboard className="h-7 w-7"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Ir al Centro de Mando</h2>
              <p className="text-[#8994A6] leading-relaxed text-sm mb-6">
                Accede al panel principal. Monitorea métricas, pausa la inteligencia artificial y responde mensajes en tiempo real desde el Buzón Omnicanal.
              </p>
              <span className="text-[#19C8E8] font-semibold text-sm">Operar Inworker &rarr;</span>
            </div>
          </Link>

          {/* OPCIÓN 2: ACTUALIZAR CONFIGURACIÓN (ONBOARDING) */}
          <Link href="/dashboard/onboarding/activacion" className="group block">
            <div className="h-full rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl transition-all hover:border-[#9B5CFF]/50 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-[#9B5CFF] h-6 w-6" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#9B5CFF]/10 text-[#9B5CFF] mb-6 border border-[#9B5CFF]/20">
                <Settings className="h-7 w-7"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Actualizar Configuración</h2>
              <p className="text-[#8994A6] leading-relaxed text-sm mb-6">
                Ingresa al flujo de configuración paso a paso. Modifica el nombre de tu agente, ajusta el Prompt Maestro o edita el nicho de tu negocio.
              </p>
              <span className="text-[#9B5CFF] font-semibold text-sm">Editar Agente &rarr;</span>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}