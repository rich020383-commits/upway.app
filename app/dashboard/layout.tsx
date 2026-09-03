"use client";

import React from 'react';
import Link from 'next/link';
import { Package, Bot, Sparkles, UserCircle, Gauge, ShieldCheck } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBusinessContext } from '@/components/business-context';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

const primaryNav = [
  { href: '/dashboard', label: 'Resumen', icon: Gauge },
  { href: '/dashboard/bots', label: 'Centro de mando', icon: Bot },
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Sparkles },
  { href: '/dashboard/admin/codigos', label: 'Accesos', icon: ShieldCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.includes('/onboarding');
  const { data: session } = useSession();
  const { clinicName, organizationName, displayRole } = useBusinessContext();

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Usuario Upway';
  const accessState = resolveBillingState(
    String((session?.user as Record<string, unknown> | undefined)?.accessState ?? 'trial')
  );
  const billingMeta = billingStateMeta[accessState];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_#f6f8fe_0%,_#edf5ff_100%)] text-slate-900 font-sans selection:bg-[#dfeaff] selection:text-slate-900">
      {!isOnboarding && (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/90 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all group-hover:border-[#1b5ed6]/20 group-hover:bg-[#edf4ff]">
                <Sparkles className="h-5 w-5 text-[#1b5ed6]" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold tracking-[0.28em] text-slate-500">{organizationName}</p>
                <p className="text-sm font-black tracking-[-0.04em] text-slate-900">Business Control</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 p-1.5 text-sm font-medium text-slate-600 md:flex">
              {primaryNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 transition-all ${pathname === href ? 'bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.15)]' : 'hover:bg-white hover:text-[#1b5ed6]'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Link href="/dashboard/inventario" className="flex items-center gap-2 rounded-full px-3 py-2 transition-all hover:bg-white hover:text-[#1b5ed6]">
                <Package className="h-4 w-4" /> Cerebro RAG
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm md:flex">
                <UserCircle className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700 capitalize">{userName}</span>
              </div>
              <div className="hidden rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 md:inline-flex">
                {clinicName}
              </div>
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 md:inline-flex">
                {displayRole}
              </div>
              <div className="hidden rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 md:inline-flex">
                {billingMeta.label}
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto min-h-screen max-w-[1500px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}