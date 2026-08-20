'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function BotonIdioma() {
  const { idioma, cambiarIdioma } = useLanguage();

  return (
    <button 
      onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
      className="px-3 py-1.5 text-sm font-medium border border-gray-600 rounded-md hover:bg-gray-800 transition text-white bg-gray-900"
    >
      {idioma === 'es' ? '🇺🇸 EN' : '🇪🇸 ES'}
    </button>
  );
}