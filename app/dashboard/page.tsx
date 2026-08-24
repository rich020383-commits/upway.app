import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Settings, LayoutDashboard, ArrowRight, Sparkles } from 'lucide-react';

// NOTA: Si usas authOptions en tu app, impórtalo y pásalo a getServerSession(authOptions)
export default async function DashboardGateway() {
  // 1. Validamos la sesión en el servidor (rápido y sin parpadeos)
  const session = await getServerSession(); 
  if (!session?.user?.email) {
    redirect('/'); // O a '/login' dependiendo de tu ruta de inicio de sesión
  }

  // 2. Buscamos al usuario y verificamos si ya configuró su IA
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tiendas: true }
  });

  // 3. ENRUTAMIENTO INTELIGENTE: Si es nuevo, va directo al Onboarding
  if (!user?.tiendas || user.tiendas.length === 0) {
    redirect('/dashboard/onboarding/activacion');
  }

  // 4. SI ES VETERANO: Mostramos la pantalla de decisión elegante
  const tiendaActual = user.tiendas[0];

  return (
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Luces de ambiente (Mantenemos tu estilo original) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#19C8E8] opacity-[0.05] blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#19C8E8]/30 bg-[#19C8E8]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#19C8E8] mb-6">
            <Sparkles className="h-4 w-4"/> Hola de nuevo, {user.name?.split(' ')[0] || 'Líder'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            ¿Qué deseas hacer con <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#19C8E8] to-[#9B5CFF]">{tiendaActual.nombre}</span>?
          </h1>
          <p className="text-[#8994A6] text-lg">Selecciona tu área de trabajo para continuar.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* OPCIÓN 1: IR AL PANEL (OPERACIÓN DIARIA) */}
          <Link href="/dashboard/bots" className="group block">
            <div className="h-full rounded-3xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-2xl transition-all duration-300 hover:border-[#19C8E8]/50 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="text-[#19C8E8] h-6 w-6" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#19C8E8]/10 text-[#19C8E8] mb-6 border border-[#19C8E8]/20">
                <LayoutDashboard className="h-7 w-7"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Ir al Centro de Mando</h2>
              <p className="text-[#8994A6] leading-relaxed text-sm mb-8">
                Accede al panel principal. Monitorea métricas, pausa la inteligencia artificial y responde mensajes en tiempo real desde el Buzón Omnicanal.
              </p>
              <div className="inline-flex items-center gap-2 text-[#19C8E8] font-semibold text-sm bg-[#19C8E8]/10 px-4 py-2 rounded-xl">
                Operar {tiendaActual.nombre} <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* OPCIÓN 2: ACTUALIZAR CONFIGURACIÓN (ONBOARDING) */}
          <Link href="/dashboard/onboarding/activacion" className="group block">
            <div className="h-full rounded-3xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-2xl transition-all duration-300 hover:border-[#9B5CFF]/50 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="text-[#9B5CFF] h-6 w-6" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9B5CFF]/10 text-[#9B5CFF] mb-6 border border-[#9B5CFF]/20">
                <Settings className="h-7 w-7"/>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Actualizar Configuración</h2>
              <p className="text-[#8994A6] leading-relaxed text-sm mb-8">
                Ingresa al flujo de configuración. Modifica el nombre de tu agente, ajusta el Prompt Maestro de ventas o edita la memoria de la IA.
              </p>
              <div className="inline-flex items-center gap-2 text-[#9B5CFF] font-semibold text-sm bg-[#9B5CFF]/10 px-4 py-2 rounded-xl">
                Editar Agente IA <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}