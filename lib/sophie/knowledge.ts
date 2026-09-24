/**
 * 📚 Base de conocimiento canónica de Sophie (RAG).
 *
 * Un solo corpus para /api/sophie:
 * - Los PRECIOS se generan desde los módulos canónicos (planes de cada
 *   vertical + lib/pricing/rules.ts): si cambia la tarifa en código, cambia
 *   aquí en el siguiente deploy — no hay cifras de precio escritas a mano.
 * - Los textos curados (capacidades, límites, activación, FAQ, enlaces) salen
 *   de la política oficial y de los propios módulos de planes.
 *
 * CONFIDENCIALIDAD (invariante verificado en lib/sophie/knowledge.test.ts):
 * este módulo NUNCA puede contener costos de proveedores (voz/IA), márgenes,
 * TRM ni cifras internas — solo tarifas públicas de Upway al cliente.
 */
import { ALL_HEALTH_PLANS, formatCOP } from '@/lib/health/plans-enterprise';
import {
  IDENTITY_MODULE_COP,
  IDENTITY_MODULE_LABEL,
  IDENTITY_MODULE_DESCRIPTION,
} from '@/lib/health/plans';
import { INMOBILIARIA_PLANS } from '@/lib/inmobiliaria/plans';
import { CENTER_PLANS } from '@/lib/center/plans';
import { VERTICALS } from '@/lib/verticals';
import { OVERAGE_COP } from '@/lib/pricing/rules';

export type KnowledgeChunk = {
  id: string;
  title: string;
  /** Keywords y frases (con tildes opcionales) para la recuperación léxica. */
  tags: string[];
  /** Texto listo para inyectar en el system prompt. */
  content: string;
  /** Trazabilidad: módulo o documento fuente. */
  source: string;
};

type PlanLike = {
  name: string;
  monthlyCOP: number;
  setupCOP: number;
  includedMinutes: number;
  includedNumbers: number;
  overageCOP: number;
  concurrentCalls: number;
  recordingRetention?: string;
  bestFor: string;
};

const fmt = formatCOP;
const num = (value: number) => value.toLocaleString('es-CO');

function planLine(p: PlanLike): string {
  if (p.monthlyCOP <= 0) {
    return `- ${p.name}: a cotizar con el equipo (volumen desde ${num(p.includedMinutes)} min/mes).`;
  }
  const retention = p.recordingRetention ? ` · grabación ${p.recordingRetention}` : '';
  return `- ${p.name}: ${fmt(p.monthlyCOP)}/mes sin IVA · implementación única ${fmt(p.setupCOP)} · ${num(p.includedMinutes)} min incluidos · ${p.includedNumbers} número(s) dedicado(s) · ${p.concurrentCalls} llamadas simultáneas · minuto adicional ${fmt(p.overageCOP)}/min${retention} · ideal para: ${p.bestFor}`;
}

const healthLines = ALL_HEALTH_PLANS.map(planLine).join('\n');
const inmobLines = INMOBILIARIA_PLANS.map(planLine).join('\n');
const centerLines = CENTER_PLANS.map(planLine).join('\n');

const CURATED: KnowledgeChunk[] = [
  {
    id: 'politica-precios',
    title: 'Política de precios y condiciones comerciales',
    tags: ['precio', 'precios', 'tarifa', 'tarifas', 'costo', 'cuanto cuesta', 'cuánto vale', 'cotizacion', 'cotización', 'iva', 'contrato', 'descuento', 'piloto', 'vigencia', 'renovacion'],
    source: 'docs/upway-politica-precios.md + lib/pricing/rules.ts',
    content: [
      'Todos los precios de Upway están en pesos colombianos (COP) y se expresan SIN IVA; el IVA en Colombia es 19% y se adiciona al facturar.',
      `Minuto adicional (el minuto que excede lo incluido): ${fmt(OVERAGE_COP)}/min, la misma tarifa en todos los planes y verticales.`,
      'La tarifa final vigente aplica desde el 1 de octubre de 2026 para activaciones nuevas.',
      'Los clientes activados antes del 1-oct-2026 conservan su tarifa hasta la renovación de su contrato.',
      'Volumen fuera de los planes publicados (desde ~60.000 min/mes, redes o EPS) y licitaciones: se cotiza con el equipo (no hay precio publicado).',
      'No hay descuentos sobre el minuto adicional ni sobre el módulo de identidad conforme; consulte al equipo por pilotos y condiciones especiales.',
    ].join('\n'),
  },
  {
    id: 'precios-health',
    title: 'Planes y precios — Upway Health (salud)',
    tags: ['plan', 'planes', 'precio', 'precios', 'salud', 'clinica', 'clinicas', 'consultorio', 'ips', 'eps', 'cuanto cuesta', 'tarifa', 'minutos'],
    source: 'lib/health/plans.ts + lib/health/plans-enterprise.ts',
    content: `Planes de voz IA 24/7 para consultorios, clínicas e IPS (tarifa vigente sep-2026):\n${healthLines}\nTodos incluyen: contestación 24/7 con el guion de la sede, toma y confirmación de datos con catálogo cerrado, grabación y log auditable.`,
  },
  {
    id: 'precios-inmobiliaria',
    title: 'Planes y precios — Inmobiliarias',
    tags: ['plan', 'planes', 'precio', 'precios', 'inmobiliaria', 'inmobiliarias', 'visita', 'visitas', 'lead', 'leads', 'cuanto cuesta', 'tarifa', 'propiedad'],
    source: 'lib/inmobiliaria/plans.ts',
    content: `Planes de captación, calificación de leads y agenda de visitas:\n${inmobLines}\nTodos incluyen voz IA 24/7, agenda sobre tu calendario, grabación con trazabilidad y webhooks de CRM.`,
  },
  {
    id: 'precios-center',
    title: 'Planes y precios — Upway Center (call center)',
    tags: ['center', 'call center', 'callcenter', 'soporte', 'tecnico', 'técnico', 'atencion al cliente', 'plan', 'planes', 'precio', 'precios', 'tarifa', 'mesa de ayuda'],
    source: 'lib/center/plans.ts',
    content: `Contact center AI-first — solo 2 líneas de servicio: atención al cliente (inbound) y soporte técnico N1 con el árbol de diagnóstico del cliente.\n${centerLines}\nFuerza de venta, cobranza y niveles superiores a N1 quedan fuera de alcance.`,
  },
  {
    id: 'identidad-conforme',
    title: 'Módulo Identidad Conforme (Res. 866/2021)',
    tags: ['identidad', 'conforme', 'resolucion 866', 'confirmacion', 'dato', 'paciente', 'modulo', 'documento', 'seguridad', 'salud'],
    source: 'lib/health/plans.ts',
    content: `${IDENTITY_MODULE_LABEL}: adicional de ${fmt(IDENTITY_MODULE_COP)} COP por sede y mes (sin IVA). ${IDENTITY_MODULE_DESCRIPTION} Solo aplica en la vertical de salud.`,
  },
  {
    id: 'capacidades',
    title: 'Capacidades operativas de Upway',
    tags: ['capacidad', 'capacidades', 'que hace', 'funciones', 'agenda', 'recordatorios', 'no-show', 'voz', 'whatsapp', 'grabacion', 'integracion', 'crm', 'api'],
    source: 'lib/*/plans.ts + lib/verticals.ts',
    content: [
      'Atención 24/7 por voz IA y WhatsApp con el guion que el negocio define.',
      'Agenda inteligente en tiempo real: confirma disponibilidad, envía recordatorios, detecta no-shows y reprograma.',
      'Calificación de leads con reglas del negocio (presupuesto, urgencia, zona) y escalamiento a un humano con contexto.',
      'Grabación de llamadas, log de eventos y evidencia auditable del registro.',
      'Integraciones: webhooks, API y export en CSV; CRM bidireccional en planes que lo incluyen.',
      'Identidad conforme para salud (confirmación dígito a dígito del dato).',
      'Multi-número y llamadas simultáneas según plan; SLA y reportes en los planes altos.',
    ].join('\n'),
  },
  {
    id: 'limites-alcance',
    title: 'Límites y alcance honesto de Upway',
    tags: ['limites', 'alcance', 'que no hace', 'restriccion', 'criterio clinico', 'historia', 'hce', 'cobranza', 'outbound', 'garantia'],
    source: 'lib/health/plans.ts + lib/center/plans.ts',
    content: [
      'Upway no emite criterio clínico: el agente sigue el protocolo y el catálogo que la sede define; no usa historia clínica ni se integra en profundidad con el HIS del cliente (solo API, webhook o CSV).',
      'Upway Center solo cubre atención al cliente (inbound) y soporte técnico N1: no hace cobranza, marketing saliente, ventas con cierre ni niveles superiores a N1.',
      'Ningún agente toma decisiones médicas, legales o financieras: siempre escala a un humano.',
      'Las llamadas se graban y quedan en log auditable; la retención depende del plan (90 días o 1 año).',
    ].join('\n'),
  },
  {
    id: 'activacion',
    title: 'Activación, onboarding y tiempos',
    tags: ['activar', 'activacion', 'onboarding', 'demo', 'probar', 'registro', 'tiempo', 'cuanto demora', 'cuánto demora', 'implementacion', 'implementación', 'self service', 'alta'],
    source: 'lib/verticals.ts + política comercial de activación',
    content: [
      'No hay activación automática ni self-serve: nada entra en producción por cuenta propia del cliente.',
      'Forma oficial de arrancar: 1) El cliente completa el onboarding de su vertical; Upway revisa la configuración, valida el plan y lo contacta para acordar el arranque (nada va a producción sin su visto bueno). 2) Tras el pago del plan, Upway implementa agente, agenda, número e integraciones y entrega el sistema activo y listo para operar.',
      'Rutas de onboarding: salud /health/onboarding · inmobiliarias /inmobiliarias/onboarding · center /center/onboarding · panel del cliente /health.',
      'Voz del agente: en el panel de Producción (/health/production) eliges entre el catálogo de voces incluidas o creas una voz propia (subes una muestra de 5–60 s o la describes con un prompt); puedes escuchar una muestra antes de guardar y se aplica al asistente.',
    ].join('\n'),
  },
  {
    id: 'verticales',
    title: 'Verticales de Upway',
    tags: ['sector', 'verticales', 'negocio', 'giro', 'tienda', 'supermercado', 'drogueria', 'retail', 'general'],
    source: 'lib/verticals.ts',
    content: Object.values(VERTICALS)
      .map((v) => `- ${v.label}: ${v.description} (onboarding: ${v.onboardingRoute})`)
      .join('\n'),
  },
  {
    id: 'faq',
    title: 'Preguntas frecuentes de Upway',
    tags: ['faq', 'pregunta', 'preguntas', 'duda', 'frecuente', 'como funciona', 'que es', 'integraciones', 'minutos de mas', 'pasarme', 'elegir plan', 'noches', 'fines de semana'],
    source: 'docs/upway-politica-precios.md + lib/*/plans.ts',
    content: [
      '¿Cuánto cuesta Upway? → Depende del sector: mira los planes de salud, inmobiliarias o center de este conocimiento; todos los precios están también en /precios.',
      `¿Qué pasa si me paso de los minutos incluidos? → Sigue atendiendo sin cortes: el minuto adicional cuesta ${fmt(OVERAGE_COP)}/min (misma tarifa en todos los planes).`,
      '¿Cuánto tardo en activarlo? → Completas el onboarding y el equipo de Upway revisa, te contacta e implementa; nada entra en producción sin tu visto bueno. No hay activación automática/self-serve.',
      '¿Se integra con mi CRM o sistema? → Sí: webhooks, API o export CSV según el plan.',
      '¿Cómo elijo el plan? → Por sedes/líneas y minutos al mes; si tu volumen supera el catálogo, el equipo te cotiza.',
      '¿Atienden de noche y fines de semana? → Sí, la atención es 24/7 por voz IA y WhatsApp.',
    ].join('\n'),
  },
  {
    id: 'enlaces',
    title: 'Enlaces oficiales de Upway',
    tags: ['enlace', 'enlaces', 'link', 'pagina', 'donde veo', 'sitio', 'web', 'precios web'],
    source: 'rutas de la aplicación',
    content: '/precios — planes y precios Health · /center/precios — planes Center · /inmobiliarias/precios — planes Inmobiliarias · /center — landing de Upway Center · /health/onboarding, /inmobiliarias/onboarding, /center/onboarding — alta según vertical · /health — panel del cliente.',
  },
];

/**
 * Invariante de confidencialidad: costos de proveedores, márgenes y cifras
 * internas jamás deben aparecer en el conocimiento que ve el LLM
 * (verificado por tests en knowledge.test.ts y prompt.test.ts).
 */
export const FORBIDDEN_COST_PATTERNS: RegExp[] = [
  /telnyx/i,
  /\btrm\b/i,
  /\b379\b/,
  /0[.,]065/,
  /0[.,]0575/,
  /13[.,]50/,
  /41[.,]?715/,
  /3[.,]090/,
  /\bmargen/i,
  /costo all-in/i,
  /costo real/i,
  /smmlv/i,
  /cost_per/i,
  /requiresTelnyx/i,
  /deal desk/i,
  /550 cop/i,
  /580 cop/i,
  /\$14 usd/i,
];

/** Corpus completo que consume lib/sophie/rag.ts. */
export const KNOWLEDGE: KnowledgeChunk[] = [...CURATED];