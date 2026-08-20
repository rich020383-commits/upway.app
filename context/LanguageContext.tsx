'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { diccionarios, Idioma } from '@/lib/diccionario'; // Ajusta la ruta si la cambiaste

type LanguageContextType = {
  idioma: Idioma;
  cambiarIdioma: (nuevoIdioma: Idioma) => void;
  t: typeof diccionarios['es']; 
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>('es');

  useEffect(() => {
    const idiomaGuardado = localStorage.getItem('upway_idioma') as Idioma;
    
    if (idiomaGuardado) {
      // Si ya había elegido un idioma antes, lo respetamos
      setIdioma(idiomaGuardado);
    } else {
      // MAGIA DE IP: Si es su primera vez, detectamos su país
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          // Lista de países que hablan español (Código ISO de 2 letras)
          const paisesLatam = ['CO', 'MX', 'ES', 'AR', 'CL', 'PE', 'EC', 'VE', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR'];
          
          // Si el país NO está en la lista (ej: US, CA, GB), lo pasamos a inglés
          if (!paisesLatam.includes(data.country_code)) {
            setIdioma('en');
            localStorage.setItem('upway_idioma', 'en'); // Lo guardamos para la próxima vez
          }
        })
        .catch(err => console.error("Error detectando IP:", err));
    }
  }, []);

  const cambiarIdioma = (nuevoIdioma: Idioma) => {
    setIdioma(nuevoIdioma);
    localStorage.setItem('upway_idioma', nuevoIdioma);
  };

  return (
    <LanguageContext.Provider value={{ idioma, cambiarIdioma, t: diccionarios[idioma] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
  return context;
};