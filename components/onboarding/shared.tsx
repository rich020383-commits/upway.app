import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface OnboardingProgressProps {
  current: number;
  total: number;
  label: string;
  valueLabel?: string;
  accentClass?: string;
  theme?: 'light' | 'dark';
}

export function OnboardingProgress({
  current,
  total,
  label,
  valueLabel,
  accentClass = 'bg-slate-900',
  theme = 'light'
}: OnboardingProgressProps) {
  const isDark = theme === 'dark';

  return (
    <div className="mb-12">
      <div className={`mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#8994A6]' : 'text-slate-500'}`}>
        <span>{label}</span>
        <span className={`h-1 w-1 rounded-full ${isDark ? 'bg-[#8994A6]' : 'bg-slate-300'}`} />
        <span className={isDark ? 'text-[#F5F7FA]' : 'text-slate-900'}>{current} / {total}</span>
        {valueLabel && (
          <span className={`ml-auto rounded-full border px-3 py-1 text-[10px] font-bold shadow-sm ${isDark ? 'border-[#1E293B] bg-[#0D1117] text-[#F5F7FA]' : 'border-slate-200 bg-white text-slate-700'}`}>
            {valueLabel}
          </span>
        )}
      </div>

      <div className="mb-10 flex gap-2">
        {Array.from({ length: total }).map((_, index) => {
          const active = index + 1 <= current;
          return (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${active ? accentClass : isDark ? 'bg-[#1E293B]' : 'bg-slate-200'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SkipToPanelLink({ className = '' }: { className?: string }) {
  return (
    <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-10">
      <Link
        href="/dashboard"
        className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 ${className}`}
      >
        Ir al Panel
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
