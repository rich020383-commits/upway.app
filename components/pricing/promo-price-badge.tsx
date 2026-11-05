// components/pricing/promo-price-badge.tsx
'use client'

import { Gift, Sparkles } from 'lucide-react'

export default function PromoPriceBadge() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#11b4b0]/40 bg-gradient-to-r from-[#0c3775] via-[#0b6a72] to-[#0ba9a9] px-3 py-2 text-white shadow-[0_4px_15px_rgba(17,180,176,0.3)]">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
          <Gift className="h-3.5 w-3.5 text-[#50e1d5]" />
        </span>
        <div className="flex-1">
          <p className="font-display text-[11px] font-bold leading-tight tracking-[-0.2px]">
            <span className="text-[#50e1d5]">🎁 Implementación GRATIS</span> fin de año
          </p>
          <p className="text-[9px] leading-snug text-white/70">
            Solo para primeros clientes. Vigente hasta 31 dic 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
