import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Bot, Settings, LayoutDashboard, ArrowRight, Sparkles, ShieldCheck, BriefcaseBusiness, TrendingUp, Stethoscope } from 'lucide-react';

export default async function DashboardGateway() {
  // 1. Validamos la sesión
  const session = await getServerSession(authOptions);
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
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(session.user.email && (adminEmails.includes(session.user.email.toLowerCase()) || session.user.email.toLowerCase() === 'revisor_meta@upway.business'));

  const coreActions = [
    {
      title: 'Centro de mando',
      description: 'Monitorea operaciones, mensajes, AI y métricas del negocio desde un único punto de control.',
      href: '/dashboard/bots',
      icon: LayoutDashboard,
      accent: 'bg-[#edf4ff] text-[#1b5ed6]',
      footer: 'Operar Upway →',
    },
    {
      title: 'Onboarding vertical',
      description: 'Revisa la configuración del negocio, activa nuevos módulos y prepara el despliegue para tu segmento.',
      href: '/dashboard/onboarding',
      icon: Settings,
      accent: 'bg-[#f3ebff] text-[#8b5cf6]',
      footer: 'Configurar flujo →',
    },
    {
      title: 'Health premium',
      description: 'Prepara la clínica con triage, políticas, escalamiento y revisar la activación del workflow clínico.',
      href: '/health/onboarding',
      icon: Stethoscope,
      accent: 'bg-[#ecfeff] text-[#0f766e]',
      footer: 'Abrir Health →',
    },
    {
      title: 'Negocio general',
      description: 'Activa un flujo comercial para retail, inmobiliaria, supermercados y otros modelos operativos.',
      href: '/dashboard/onboarding?segment=general',
      icon: BriefcaseBusiness,
      accent: 'bg-[#e0f2fe] text-[#0369a1]',
      footer: 'Mapear segmento →',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_#f5f9ff_0%,_#edf5ff_100%)] text-slate-900 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,94,214,0.03),transparent_35%,rgba(45,212,191,0.03))]" />

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfeaff] bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#1b5ed6] mb-6 shadow-[0_10px_30px_rgba(27,94,214,0.08)]">
            <Sparkles className="h-4 w-4"/> Hola de nuevo, {user.name || 'Líder'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.06em] mb-4 text-slate-900">
            ¿Qué deseas hacer con <span className="text-[#1b5ed6]">{tiendaActual.nombre}</span>?
          </h1>
          <p className="text-slate-600 text-lg">Selecciona tu área de trabajo para continuar con el modelo multi-vertical de Upway.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {coreActions.map(({ title, description, href, icon: Icon, accent, footer }) => (
            <Link key={title} href={href} className="group block">
              <div className="h-full rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-[#1b5ed6]/30 hover:shadow-[0_24px_70px_rgba(27,94,214,0.12)] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="text-[#1b5ed6] h-6 w-6" />
                </div>
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dfeaff] ${accent} shadow-[0_10px_24px_rgba(27,94,214,0.08)]`}>
                  <Icon className="h-7 w-7"/>
                </div>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900 mb-3">{title}</h2>
                <p className="text-slate-600 leading-relaxed text-sm mb-6">{description}</p>
                <span className="text-[#1b5ed6] font-semibold text-sm">{footer}</span>
              </div>
            </Link>
          ))}

          {isAdmin && (
            <Link href="/dashboard/admin/codigos" className="group block md:col-span-2">
              <div className="h-full rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#0d1727] to-[#1b5ed6] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(27,94,214,0.18)] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-6 opacity-80">
                  <ArrowRight className="h-6 w-6 text-white/80" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white mb-6 border border-white/15">
                  <ShieldCheck className="h-7 w-7"/>
                </div>
                <h2 className="text-2xl font-black tracking-[-0.04em] mb-3">Administración de acceso</h2>
                <p className="text-slate-200 leading-relaxed text-sm mb-6">
                  Gestiona códigos promocionales, pruebas y accesos premium para clientes selectos. Define el estado, rol autorizado y vencimiento de cada código.
                </p>
                <span className="font-semibold text-sm text-white/90">Configurar códigos &rarr;</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}