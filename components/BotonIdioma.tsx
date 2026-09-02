'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function BotonIdioma() {
  const { idioma, cambiarIdioma } = useLanguage();
  const esActivo = idioma === 'es';

  return (
    <button
      type="button"
      aria-label={esActivo ? 'Cambiar a inglés' : 'Cambiar a español'}
      onClick={() => cambiarIdioma(esActivo ? 'en' : 'es')}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className={esActivo ? 'text-slate-900 font-semibold' : 'text-slate-400'}>ES</span>
      <span className="text-slate-300">/</span>
      <span className={!esActivo ? 'text-slate-900 font-semibold' : 'text-slate-400'}>EN</span>
    </button>
  );
}