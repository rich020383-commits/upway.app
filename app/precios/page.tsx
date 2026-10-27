
import Link from 'next/link';
import { formatCOP } from '@/lib/health/plans-enterprise';
import {
  withIVA,
  IDENTITY_MODULE_COP,
  IDENTITY_MODULE_LABEL,
  IDENTITY_MODULE_DESCRIPTION,
} from '@/lib/health/plans';
import { LEGAL_ENTITY } from '@/lib/legal';
import {
  VOICE_CLONE_MODULE_COP,
  VOICE_CLONE_MODULE_LABEL,
  VOICE_CLONE_MODULE_DESCRIPTION,
} from '@/lib/pricing/rules';

export const metadata = {
  title: 'Planes y precios Upway - Salud, Inmobiliarias y Call Center | Upway',
  description: 'Planes de voz IA para salud, inmobiliarias y call center. Minutos, numeros simultaneos y precios transparentes en COP con IVA incluido.',
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#0d3168] tracking-tight">Upway</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/precios/salud" className="hover:text-[#0d3168] transition">Health</Link>
            <Link href="/precios/inmobiliarias" className="hover:text-[#0d3168] transition">Inmobiliaria</Link>
            <Link href="/precios/center" className="hover:text-[#0d3168] transition">Center</Link>
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