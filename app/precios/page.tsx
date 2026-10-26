"use client";
import Link from 'next/link';
import { useState } from 'react';
import {
  ALL_HEALTH_PLANS,
  formatCOP,
  HEALTH_PLANS_ENTERPRISE,
} from '@/lib/health/plans-enterprise';
import {
  withIVA,
  FACILITY_TYPE_OPTIONS,
  IDENTITY_MODULE_COP,
  IDENTITY_MODULE_LABEL,
  IDENTITY_MODULE_DESCRIPTION,
} from '@/lib/health/plans';
import { VOICE_CLONE_MODULE_COP, VOICE_CLONE_MODULE_LABEL, VOICE_CLONE_MODULE_DESCRIPTION } from '@/lib/pricing/rules';
import { INMOBILIARIA_PLANS, STANDARD_INMOB_PLANS } from '@/lib/inmobiliaria/plans';
import { CENTER_PLANS, STANDARD_CENTER_PLANS } from '@/lib/center/plans';
import { LEGAL_ENTITY } from '@/lib/legal';

export const metadata = {
  title: 'Planes y precios Upway - Salud, Inmobiliarias y Call Center | Upway',
  description: 'Planes de voz IA para salud, inmobiliarias y call center. Minutos, numeros simultaneos y precios transparentes en COP con IVA incluido.',
};

type VerticalId = 'health' | 'inmobiliaria' | 'center';

const VERTICAL_INFO: Record<VerticalId, { label: string; subtitle: string; accent: string; accentLight: string; textDark: string }> = {
  health: {
    label: 'Upway Health',
    subtitle: 'Clínicas, IPS, consultorios y EPS',
    accent: '#1b5ed6',
    accentLight: '#edf5ff',
    textDark: '#0f172a',
  },
  inmobiliaria: {
    label: 'Upway Inmobiliarias',
    subtitle: 'Captación, seguimiento comercial y agenda de visitas',
    accent: '#0ba9a9',
    accentLight: '#e7fbfa',
    textDark: '#0d3168',
  },
  center: {
    label: 'Upway Center',
    subtitle: 'Call center: servicio técnico y atención al cliente 24/7',
    accent: '#e11d48',
    accentLight: '#fef3f2',
    textDark: '#450a0a',
  },
};

type GenericPlan = {
  id: string;
  name: string;
  tagline: string;
  monthlyCOP: number;
  setupCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  concurrentCalls: number;
  overageCOP: number;
  features: string[];
  bestFor: string;
  target?: string[];
  serviceLine?: string;
  isCustom?: boolean;
  requiresApproval?: boolean;
};

function FacilityBadge({ type }: { type: string }) {
  const facility = FACILITY_TYPE_OPTIONS.find((f) => f.id === type);
  if (!facility) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[#edf5ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1b5ed6]">
      {facility.label}
    </span>
  );
}
export default function PreciosPage() {
  const [activeVertical, setActiveVertical] = useState<VerticalId>('health');

  const healthStandard = ALL_HEALTH_PLANS.filter((p: GenericPlan) => p.monthlyCOP > 0);
  const healthEnterprise = HEALTH_PLANS_ENTERPRISE.filter((p: GenericPlan) => p.monthlyCOP > 0);

  return (
    <div className="min-h-screen bg-[#f4farr]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#0d3168] tracking-tight">Upway</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/precios#precios-health" className={`hover:text-[#0d3168] transition ${activeVertical === 'health' ? 'text-[#0d3168] font-bold' : ''}`} onClick={() => setActiveVertical('health')}>Health</Link>
            <Link href="/precios#precios-inmobiliaria" className={`hover:text-[#0d3168] transition ${activeVertical === 'inmobiliaria' ? 'text-[#0d3168] font-bold' : ''}`} onClick={() => setActiveVertical('inmobiliaria')}>Inmobiliaria</Link>
            <Link href="/precios#precios-center" className={`hover:text-[#0d3168] transition ${activeVertical === 'center' ? 'text-[#0d3168] font-bold' : ''}`} onClick={() => setActiveVertical('center')}>Center</Link>
          </nav>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <section className="bg-gradient-to-br from-[#0f172a] to-[#132642] py-20 px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tight mb-4">Planes y precios para tu operación</h1>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Elige tu vertical: Salud, Inmobiliarias o Call Center. Planes con minutos incluidos, números dedicados y minuto adicional único. Todo con IVA incluido.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-black text-center text-[#0d3168] mb-12">Módulos adicionales</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6 md:flex md:items-center md:gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900">{IDENTITY_MODULE_LABEL}</h3>
                  <p className="mt-1 text-sm text-emerald-700">{IDENTITY_MODULE_DESCRIPTION}</p>
                  <p className="mt-2 text-xs text-slate-500">Disponible sobre cualquier plan Health. Se activa con DPA firmado.</p>
                </div>
                <div className="mt-4 text-center md:mt-0">
                  <p className="text-2xl font-black text-emerald-700">{formatCOP(withIVA(IDENTITY_MODULE_COP))}</p>
                  <p className="text-xs text-emerald-600">por sede/mes · IVA 19% incluido</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-sky-200 bg-sky-50/70 p-6 md:flex md:items-center md:gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-sky-900">{VOICE_CLONE_MODULE_LABEL}</h3>
                  <p className="mt-1 text-sm text-sky-700">{VOICE_CLONE_MODULE_DESCRIPTION}</p>
                  <p className="mt-2 text-xs text-slate-500">Disponible sobre cualquier plan. La voz la autoriza su titular.</p>
                </div>
                <div className="mt-4 text-center md:mt-0">
                  <p className="text-2xl font-black text-sky-700">{formatCOP(withIVA(VOICE_CLONE_MODULE_COP))}</p>
                  <p className="text-xs text-sky-600">por sede/mes · IVA 19% incluido</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#0f172a] to-[#132642] py-16 px-4">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-black text-white">Listo para dejar de perder llamadas?</h2>
            <p className="mt-3 text-slate-300">Empieza con un piloto medido. Sin contratos largos; con DPA cuando se activa identidad conforme.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login?segment=health" className="w-full rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto">Comenzar ahora</Link>
              <a href="mailto:contacto@upway.business?subject=Quiero%20cotizar%20Upway" className="w-full rounded-full border border-white/30 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 sm:w-auto">Hablar con ventas</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400 bg-white">
        {LEGAL_ENTITY} · Marca Upway — Bogotá, Colombia
      </footer>
    </div>
  );
}