// components/landing/promo-banner.tsx
'use client'

import { Gift, Sparkles, ArrowRight } from 'lucide-react'

export default function PromoBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#11b4b0]/30 bg-gradient-to-r from-[#0c3775] via-[#0b6a72] to-[#0ba9a9] px-4 py-3.5 text-white shadow-[0_8px_30px_rgba(17,180,176,0.35)]"
      style={{
        backgroundSize: '200% 200%',
        animation: 'promo-gradient 4s ease infinite',
      }}
    >
      {/* Efecto de luz pulsante */}
      <div
        className="pointer-events-none absolute -top-1/2 -left-1/4 h-[200%] w-1/2 bg-white/10 blur-3xl"
        style={{ animation: 'promo-shine 3s ease-in-out infinite' }}
      />

      <div className="relative flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-sm">
            <Gift className="h-4.5 w-4.5 text-[#50e1d5]" />
          </span>
          <div>
            <p className="font-display text-[13px] font-bold leading-tight tracking-[-0.3px] sm:text-[14px]">
              <span className="text-[#50e1d5]">🎁 Implementación GRATIS</span> por fin de año
            </p>
            <p className="text-[11px] leading-snug text-white/75 sm:text-[12px]">
              Para tus primeros clientes: sin costo de implementación hasta el 31 de diciembre.
            </p>
          </div>
        </div>

        <a
          href="/precios"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-[12px] font-bold backdrop-blur-sm transition hover:bg-white/30 hover:shadow-[0_4px_15px_rgba(255,255,255,0.2)]"
        >
          Ver planes <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <style jsx>{`
        @keyframes promo-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes promo-shine {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
