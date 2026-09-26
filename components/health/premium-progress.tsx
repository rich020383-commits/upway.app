'use client';

/**
 * Barra de progreso de etapas.
 *
 * Es el mismo lenguaje visual del wizard de Center/Inmobiliaria (barra fina con
 * relleno degradado) transplanted al flujo Health. El porcentaje solo no dice
 * NADA de dónde vas: la barra sí da la sensación de avance continuo, que es
 * lo que hace que un formulario de 8 pasos se sienta corto.
 */
export default function PremiumProgress({
  value,
  label,
  right,
}: {
  /** 0–100. */
  value: number;
  label: string;
  right?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#1b5ed6]">
          {right ?? `${pct}%`}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,_#1b5ed6_0%,_#4d8bff_55%,_#0ba9a9_100%)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
