"use client";

import Link from 'next/link';
import {
  Activity,
  BarChart3,
  BriefcaseMedical,
  FileText,
  House,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
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
  { href: '/health/settings', label: 'Configuración', icon: Settings, module: 'settings' },
  { href: '/health/onboarding', label: 'Onboarding', icon: Activity, module: 'onboarding' },
] as const;

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { clinicName, organizationName, role, displayRole } = useBusinessContext();

  const visibleNavItems = navItems.filter(({ module }) => canAccessHealthModule(role, module));

  return (
    <div className="upway-shell relative flex min-h-screen flex-col text-slate-900 lg:flex-row">
      <aside className="relative z-10 w-full border-b border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(234,244,255,0.84))] p-4 backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(15,23,42,0.05)] lg:w-[240px] lg:border-b-0 lg:border-r lg:shadow-[inset_-1px_0_0_rgba(15,23,42,0.05)]">
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
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="truncate font-bold text-slate-800">{clinicName}</div>
            <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-slate-600">Live</span>
          </div>
        </div>

        <nav className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'border border-[#dfeaff] bg-[linear-gradient(135deg,#edf4ff,#eafaf5)] text-[#1b5ed6] shadow-sm'
                    : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/60 hover:text-slate-900',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={2.2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(239,245,255,0.9))] px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Clinical workspace</div>
            <div className="mt-1 text-[20px] font-black tracking-[-0.04em] text-slate-900">Resumen ejecutivo</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Sistema saludable</span>
            <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#1b5ed6]">{displayRole}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
