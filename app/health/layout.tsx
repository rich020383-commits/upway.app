"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  BriefcaseMedical,
  CalendarCheck2,
  FileText,
  House,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { canAccessHealthModule } from '@/lib/health/permissions';
import { useBusinessContext } from '@/components/business-context';

const navItems = [
  { href: '/health', label: 'Inicio', icon: House, module: 'overview' },
  { href: '/health/clinics', label: 'Clínicas', icon: BriefcaseMedical, module: 'clinics' },
  { href: '/health/inbox', label: 'Bandeja', icon: MessageSquareText, module: 'inbox' },
  { href: '/health/agents', label: 'Agentes', icon: Users, module: 'agents' },
  { href: '/health/triage', label: 'Triaje', icon: Activity, module: 'triage' },
  { href: '/health/policies', label: 'Políticas', icon: ShieldCheck, module: 'policies' },
  { href: '/health/faq', label: 'FAQ', icon: FileText, module: 'faq' },
  { href: '/health/analytics', label: 'Reportes', icon: BarChart3, module: 'analytics' },
  { href: '/health/compliance', label: 'Cumplimiento', icon: BriefcaseMedical, module: 'compliance' },
  { href: '/health/approvals', label: 'Aprobaciones', icon: ShieldCheck, module: 'approvals' },
  { href: '/health/audit', label: 'Auditoría', icon: FileText, module: 'audit' },
  { href: '/health/production', label: 'Producción', icon: ShieldCheck, module: 'production' },
  { href: '/health/agenda', label: 'Agenda', icon: CalendarCheck2, module: 'production' },
  { href: '/health/settings', label: 'Configuración', icon: Settings, module: 'settings' },
  { href: '/health/onboarding', label: 'Onboarding', icon: Activity, module: 'onboarding' },
] as const;

/**
 * El menú de 15 entradas en una sola lista no dice nada: el dueño no sabe
 * dónde empezar. Se agrupa por lo que hace cada bloque con el usuario.
 */
const NAV_SECTIONS = [
  { label: 'Operación diaria', hrefs: ['/health', '/health/inbox', '/health/agents', '/health/agenda'] },
  {
    label: 'Contenido clínico',
    hrefs: ['/health/clinics', '/health/triage', '/health/policies', '/health/faq'],
  },
  {
    label: 'Entrega y cumplimiento',
    hrefs: ['/health/production', '/health/approvals', '/health/compliance', '/health/audit', '/health/analytics'],
  },
  { label: 'Cuenta', hrefs: ['/health/settings', '/health/onboarding'] },
] as const;

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { clinicName, organizationName, role, displayRole } = useBusinessContext();

  /**
   * En móvil el aside va PRIMERO en el DOM, así que con 15 entradas el menú
   * entero empujaba el título de la página y el contenido fuera de pantalla:
   * había que atravesar el menú para saber dónde estabas. Por eso en móvil el
   * menú arranca cerrado. En `lg` nunca se oculta.
   */
  const [navOpen, setNavOpen] = useState(false);

  const visibleNavItems = navItems.filter(({ module }) => canAccessHealthModule(role, module));

  /**
   * El título del header Sale de la ruta, no es texto fijo. Antes ponía
   * "Resumen ejecutivo" en las quince pantallas, incluida Agenda: el rótulo
   * mentía y por eso el shell se leía como plantilla.
   * Se elige la coincidencia MÁS larga: '/health' es prefijo de todas, así
   * que sin ordenar, Agenda y Producción salían con el título de Inicio.
   */
  const current = [...visibleNavItems]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const renderNavItem = ({ href, label, icon: Icon }: (typeof visibleNavItems)[number]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setNavOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={[
          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all',
          active
            ? 'border border-[#dfeaff] bg-[linear-gradient(135deg,#edf4ff,#eafaf5)] font-bold text-[#1b5ed6] shadow-[0_8px_20px_rgba(27,94,214,0.12)]'
            : 'border border-transparent font-semibold text-slate-600 hover:translate-x-0.5 hover:border-slate-200 hover:bg-white/60 hover:text-slate-900',
        ].join(' ')}
      >
        <Icon size={15} strokeWidth={active ? 2.4 : 2} />
        {label}
      </Link>
    );
  };

  return (
    <div className="upway-shell relative flex min-h-screen flex-col text-slate-900 lg:flex-row">
      <aside className="relative z-10 w-full border-b border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(234,244,255,0.84))] p-4 pt-[max(env(safe-area-inset-top),2.75rem)] backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(15,23,42,0.05)] lg:w-[240px] lg:border-b-0 lg:border-r lg:pt-4 lg:shadow-[inset_-1px_0_0_rgba(15,23,42,0.05)]">
        <div className="mb-6 rounded-[20px] border border-sky-100 bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#eaf3ff,#dfeaff)] text-[11px] font-black text-[#1b5ed6] shadow-sm">U</div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-slate-500">{organizationName}</div>
              <div className="text-[22px] font-black tracking-[-0.05em] text-slate-900">Health</div>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[18px] border border-[#d8e8ff] bg-[linear-gradient(135deg,#edf5ff,#e9f7f4)] p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Clínica</div>
          <div className="mt-2 truncate font-bold text-slate-800">{clinicName}</div>
        </div>
        {/* Antes esta píldora decía "Live" siempre, sin consultar nada: era
            una afirmación de salud del sistema dentro del shell, y no le
            correspondía. El estado real vive en Producción, que sí lo mide. */}

        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-controls="health-nav"
          className="mb-4 flex w-full items-center justify-between gap-2 rounded-[16px] border border-slate-200 bg-white/70 px-3.5 py-3 text-left lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
            {navOpen ? <X size={16} /> : <Menu size={16} />}
            {navOpen ? 'Cerrar menú' : 'Menú'}
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#1b5ed6]">
              {current?.label ?? 'Health'}
            </span>
          </span>
        </button>

        <nav
          id="health-nav"
          className={`${navOpen ? 'grid' : 'hidden'} gap-1.5 sm:grid-cols-2 lg:grid lg:grid-cols-1`}
        >
          {NAV_SECTIONS.map((section) => {
            const items = visibleNavItems.filter((item) =>
              (section.hrefs as readonly string[]).includes(item.href)
            );
            if (items.length === 0) return null;
            return (
              <div key={section.label} className="mb-1">
                <div className="mb-1.5 px-3 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-400">
                  {section.label}
                </div>
                <div className="space-y-1">{items.map(renderNavItem)}</div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(239,245,255,0.9))] px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Clinical workspace</div>
            <div className="mt-1 text-[20px] font-black tracking-[-0.04em] text-slate-900">
              {current?.label ?? 'Upway Health'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/health/production"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
            >
              <ShieldCheck size={14} strokeWidth={2.2} />
              Producción
            </Link>
            {/* "Sistema saludable" estaba fijo en todas las pantallas, en verde,
                sin medir nada. El checklist de Producción sí dice la verdad
                (checks verdes / bloqueos reales), así que la señal se queda
                donde está medida. */}
            <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#1b5ed6]">
              {displayRole}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
