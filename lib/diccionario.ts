// Archivo: lib/diccionario.ts

export const diccionarios = {
  es: {
    dashboard: {
      titulo: "Panel de Control",
      conectar: "Conectar con Meta",
      estado_desconectado: "Estado: Desconectado",
      estado_conectado: "¡Línea conectada!",
    }
  },
  en: {
    dashboard: {
      titulo: "Dashboard",
      conectar: "Connect with Meta",
      estado_desconectado: "Status: Disconnected",
      estado_conectado: "Line connected!",
    }
  }
};

export type Idioma = 'es' | 'en';