import { create } from 'zustand';

// Precios de los módulos corporativos para el cálculo dinámico
const PRECIOS_MODULOS: Record<string, number> = {
  whatsapp: 49,
  voz: 59,
  calendario: 29
};

interface UpwayState {
  // PASO 01: Descubrimiento
  objetivoPrincipal: string | null;
  setObjetivoPrincipal: (objetivo: string) => void;

  // PASO 02: Lienzo Modular
  modulosSeleccionados: string[];
  totalMensual: number;
  toggleModulo: (moduloId: string) => void;

  // PASOS 04 y 05: Personalización
  nombreAgente: string;
  nicho: string;
  promptMaestro: string;
  vozSeleccionada: string;
  tonoWhatsapp: { formalidad: number; cercania: number; persuasion: number };
  
  setNombreAgente: (nombre: string) => void;
  setNicho: (nicho: string) => void;
  setPromptMaestro: (prompt: string) => void;
  setVozSeleccionada: (voz: string) => void;
  setTonoWhatsapp: (tono: Partial<UpwayState['tonoWhatsapp']>) => void;

  // 🔥 NUEVO: Función para limpiar todo tras el pago exitoso
  resetOnboarding: () => void;
}

export const useUpwayStore = create<UpwayState>((set) => ({
  // Valores Iniciales (Mochila vacía)
  objetivoPrincipal: null,
  modulosSeleccionados: [],
  totalMensual: 0,
  
  nombreAgente: '',
  nicho: 'general',
  promptMaestro: '',
  vozSeleccionada: 'femenina_estrella',
  tonoWhatsapp: { formalidad: 50, cercania: 50, persuasion: 50 },

  // Acciones (Las conexiones neuronales)
  setObjetivoPrincipal: (objetivo) => set({ objetivoPrincipal: objetivo }),
  
  toggleModulo: (moduloId) => set((state) => {
    const yaEstaSeleccionado = state.modulosSeleccionados.includes(moduloId);
    const nuevosModulos = yaEstaSeleccionado 
      ? state.modulosSeleccionados.filter(id => id !== moduloId) 
      : [...state.modulosSeleccionados, moduloId]; 
      
    const nuevoTotal = nuevosModulos.reduce((suma, id) => suma + (PRECIOS_MODULOS[id] || 0), 0);
    return { modulosSeleccionados: nuevosModulos, totalMensual: nuevoTotal };
  }),

  setNombreAgente: (nombre) => set({ nombreAgente: nombre }),
  setNicho: (nicho) => set({ nicho }),
  setPromptMaestro: (prompt) => set({ promptMaestro: prompt }),
  setVozSeleccionada: (voz) => set({ vozSeleccionada: voz }),
  setTonoWhatsapp: (tono) => set((state) => ({ 
    tonoWhatsapp: { ...state.tonoWhatsapp, ...tono } 
  })),

  // 🔥 NUEVO: Implementación de la limpieza (Resetea a los valores base)
  resetOnboarding: () => set({
    objetivoPrincipal: null,
    modulosSeleccionados: [],
    totalMensual: 0,
    nombreAgente: '',
    nicho: 'general',
    promptMaestro: '',
    vozSeleccionada: 'femenina_estrella',
    tonoWhatsapp: { formalidad: 50, cercania: 50, persuasion: 50 },
  }),
}));