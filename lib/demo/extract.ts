/**
 * Extractor determinista de datos de lead desde el transcript de la demo.
 * No usa LLM (ahorra costo y latencia): busca palabras clave en los turnos
 * del usuario y del asistente. Suficiente para la demo BOOM y como base
 * para reemplazarlo por un extractor con Gemini si se quiere mayor precisión.
 */

import type { DemoMessage } from './store';

export type DemoLeadData = {
  sector?: string;
  dolor?: string;
  interes?: 'alto' | 'medio' | 'bajo';
  nombre?: string;
  telefono?: string;
  email?: string;
  mensajesCapturados: string[];
};

/** Palabras clave que indican sector del negocio. */
const SECTOR_KEYWORDS: Record<string, string[]> = {
  salud: ['clinica', 'consultorio', 'ips', 'medico', 'medicina', 'salud', 'paciente', 'cita medica', 'odontologo', 'dental'],
  inmobiliaria: ['inmobiliaria', 'inmueble', 'casa', 'apartamento', 'arriendo', 'venta de casa', 'asesor inmobiliario'],
  'call center': ['call center', 'centro de llamadas', 'atencion al cliente', 'soporte tecnico', 'telemarketing'],
  general: ['empresa', 'negocio', 'local', 'tienda', 'servicio'],
};

/** Palabras clave de dolor operativo. */
const DOLOR_KEYWORDS: Record<string, string[]> = {
  'llamadas perdidas': [
    'llamada perdida', 'perdemos llamadas', 'no contestamos', 'llamadas sin responder',
    'llamadas caídas', 'no nos llaman', 'perdemos clientes por teléfono',
  ],
  'agenda desordenada': [
    'agenda', 'citas', 'reprogramar', 'cancelar cita', 'olvidamos',
    'agenda desordenada', 'no controlamos las citas', 'solapamos citas',
  ],
  'seguimiento manual': [
    'seguimiento', 'manual', 'hoja de calculo', 'excel', 'libreta',
    'seguimiento de leads', 'seguimiento de clientes',
  ],
  'equipo saturado': [
    'saturado', 'sobrecargado', 'no damos abasto', 'demasiado trabajo',
    'no damos respuesta', 'no podemos atender',
  ],
  'clientes que no responden': [
    'cliente no responde', 'no nos devuelven la llamada', 'no contestan el telefono',
    'no nos responden', 'clientes fríos',
  ],
};

/** Palabras clave de interés alto. */
const INTERES_ALTO = ['quiero', 'me interesa', 'cuanto cuesta', 'precio', 'plan', 'contratar', 'demo', 'agendar', 'llamar'];
const INTERES_MEDIO = ['tal vez', 'quizas', 'informacion', 'mas detalles', 'despues', 'despues lo vemos'];

function normalizar(texto: string): string {
  return texto.toLowerCase().trim();
}

function contieneAlguna(texto: string, claves: string[]): boolean {
  const t = normalizar(texto);
  return claves.some((c) => t.includes(c));
}

function extraerSector(mensajes: DemoMessage[]): string | undefined {
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    for (const [sector, claves] of Object.entries(SECTOR_KEYWORDS)) {
      if (contieneAlguna(m.text, claves)) return sector;
    }
  }
  return undefined;
}

function extraerDolor(mensajes: DemoMessage[]): string | undefined {
  const hits: string[] = [];
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    for (const [dolor, claves] of Object.entries(DOLOR_KEYWORDS)) {
      if (contieneAlguna(m.text, claves) && !hits.includes(dolor)) hits.push(dolor);
    }
  }
  return hits.length > 0 ? hits[0] : undefined;
}

function extraerInteres(mensajes: DemoMessage[]): 'alto' | 'medio' | 'bajo' | undefined {
  let alto = 0;
  let medio = 0;
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    if (contieneAlguna(m.text, INTERES_ALTO)) alto++;
    if (contieneAlguna(m.text, INTERES_MEDIO)) medio++;
  }
  if (alto > 0) return 'alto';
  if (medio > 0) return 'medio';
  if (mensajes.filter((m) => m.role === 'user').length > 0) return 'bajo';
  return undefined;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const TELEFONO_RE = /\+?\d[\d\s\-]{6,}\d/;

function extraerNombre(mensajes: DemoMessage[]): string | undefined {
  // Busca patrones tipo "me llamo X", "soy X", "mi nombre es X"
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    const t = normalizar(m.text);
    const patrones = [
      /me llamo\s+([a-záéíóúññ\s]{2,40})/i,
      /soy\s+([a-záéíóúññ\s]{2,40})/i,
      /mi nombre es\s+([a-záéíóúññ\s]{2,40})/i,
      /nombre\s+es\s+([a-záéíóúññ\s]{2,40})/i,
    ];
    for (const p of patrones) {
      const mm = t.match(p);
      if (mm?.[1]) return mm[1].trim().replace(/\s+/g, ' ');
    }
  }
  return undefined;
}

function extraerTelefono(mensajes: DemoMessage[]): string | undefined {
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    const mm = m.text.match(TELEFONO_RE);
    if (mm) return mm[0];
  }
  return undefined;
}

function extraerEmail(mensajes: DemoMessage[]): string | undefined {
  for (const m of mensajes) {
    if (m.role !== 'user') continue;
    const mm = m.text.match(EMAIL_RE);
    if (mm) return mm[0];
  }
  return undefined;
}

const CAPTURAR_KEYWORDS = ['datos', 'contacto', 'llamar', 'asesor', 'demo'];

function extraerMensajesCapturados(mensajes: DemoMessage[]): string[] {
  const out: string[] = [];
  for (const m of mensajes) {
    if (m.role !== 'assistant') continue;
    if (contieneAlguna(m.text, CAPTURAR_KEYWORDS)) {
      out.push(m.text);
    }
  }
  return out.slice(0, 10);
}

/**
 * Extrae un lead structurado del transcript completo.
 * Ideal para la tarjeta BOOM del panel y, opcionalmente, para crear un
 * lead en la tienda del usuario que hace la demo.
 */
export function extractLeadData(mensajes: DemoMessage[]): DemoLeadData {
  return {
    sector: extraerSector(mensajes),
    dolor: extraerDolor(mensajes),
    interes: extraerInteres(mensajes),
    nombre: extraerNombre(mensajes),
    telefono: extraerTelefono(mensajes),
    email: extraerEmail(mensajes),
    mensajesCapturados: extraerMensajesCapturados(mensajes),
  };
}