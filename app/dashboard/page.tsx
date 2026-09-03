import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Settings, LayoutDashboard, ArrowRight, Sparkles, ShieldCheck, BriefcaseBusiness, Stethoscope } from 'lucide-react';

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_#f5f9ff_0%,_#edf5ff_100%)] text-slate-900 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,94,214,0.03),transparent_35%,rgba(45,212,191,0.03))]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[32px] border border-slate-200/80 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfeaff] bg-[#edf4ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#1b5ed6]">
              <Sparkles className="h-4 w-4" /> Hola de nuevo, {user.name || 'Líder'}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Workspace activo
            </div>
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] text-slate-900 md:text-5xl">
            ¿Qué deseas hacer con <span className="text-[#1b5ed6]">{tiendaActual.nombre}</span>?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Selecciona tu área de trabajo para continuar con el modelo multi-vertical de Upway.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {coreActions.map(({ title, description, href, icon: Icon, accent, footer }) => (
            <Link key={title} href={href} className="group block">
              <div className="relative h-full overflow-hidden rounded-[30px] border border-slate-200 bg-white/80 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#cfe2ff] hover:shadow-[0_26px_70px_rgba(27,94,214,0.12)] backdrop-blur-sm">
                <div className="absolute right-5 top-5 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-6 w-6 text-[#1b5ed6]" />
                </div>
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] border ${accent} shadow-[0_10px_24px_rgba(27,94,214,0.08)]`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="mb-3 text-2xl font-black tracking-[-0.04em] text-slate-900">{title}</h2>
                <p className="mb-6 text-sm leading-6 text-slate-600">{description}</p>
                <span className="text-sm font-semibold text-[#1b5ed6]">{footer}</span>
              </div>
            </Link>
          ))}

          {isAdmin && (
            <Link href="/dashboard/admin/codigos" className="group block md:col-span-2">
              <div className="relative h-full overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-[#0d1727] to-[#1b5ed6] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(27,94,214,0.18)]">
                <div className="absolute right-5 top-5 opacity-80">
                  <ArrowRight className="h-6 w-6 text-white/80" />
                </div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-white">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="mb-3 text-2xl font-black tracking-[-0.04em]">Administración de acceso</h2>
                <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-200">
                  Gestiona códigos promocionales, pruebas y accesos premium para clientes selectos. Define el estado, rol autorizado y vencimiento de cada código.
                </p>
                <span className="text-sm font-semibold text-white/90">Configurar códigos →</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}