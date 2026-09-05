export type BusinessSegment = 'general' | 'inmobiliaria' | 'drogueria' | 'retail' | 'supermercado';

export type IndustryMetricDef = {
  key: 'totalLeads' | 'newLeads' | 'appointments' | 'pendingReminders' | 'todayAppointments';
  label: string;
  hint: string;
  accent: string;
};

export type IndustryPipelineStage = {
  key: 'NEW' | 'CONTACTED' | 'APPOINTMENT_BOOKED' | 'FOLLOW_UP' | 'CLOSED_WON';
  label: string;
  action: string;
  next?: IndustryPipelineStage['key'];
};

export type IndustryConfig = {
  label: string;
  /** Unidad de negocio que se atiende (cliente, paciente, visitante...) */
  audienceNoun: string;
  /** Sustantivo para "cita" según el negocio */
  appointmentNoun: string;
  metrics: IndustryMetricDef[];
  pipeline: IndustryPipelineStage[];
  /** Chips de servicios activos para el centro de mando */
  serviceCards: Array<{ title: string; text: string; badge: string; tone: string }>;
};

const baseServiceCards = (appointmentNoun: string, audienceNoun: string) => [
  {
    title: 'Agente WhatsApp',
    text: 'Mensajes y captura operativos',
    badge: 'Live',
    tone: 'border-sky-500/40 bg-sky-500/10 text-sky-700',
  },
  {
    title: `Agenda de ${appointmentNoun.toLowerCase()}s`,
    text: 'Disponibilidad automatizada en la agenda Upway',
    badge: 'Booking',
    tone: 'border-violet-500/40 bg-violet-500/10 text-violet-700',
  },
  {
    title: 'Follow-up',
    text: 'Recordatorios y escalamiento por estado',
    badge: 'Automático',
    tone: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  },
  {
    title: 'Operación',
    text: `Asignación, pipeline y cierre de ${audienceNoun}s`,
    badge: 'Core',
    tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
  },
];

export const INDUSTRY_CONFIG: Record<BusinessSegment, IndustryConfig> = {
  general: {
    label: 'Negocio general',
    audienceNoun: 'cliente',
    appointmentNoun: 'Cita',
    metrics: [
      { key: 'totalLeads', label: 'Leads totales', hint: 'Base de datos completa', accent: 'text-sky-600' },
      { key: 'newLeads', label: 'Nuevos', hint: 'Sin primer contacto', accent: 'text-emerald-600' },
      { key: 'appointments', label: 'Citas próximas', hint: 'Agenda Upway', accent: 'text-violet-600' },
      { key: 'pendingReminders', label: 'Recordatorios', hint: 'Programados', accent: 'text-amber-600' },
      { key: 'todayAppointments', label: 'Hoy', hint: 'Citas del día', accent: 'text-rose-600' },
    ],
    pipeline: [
      { key: 'NEW', label: 'Nuevo', action: 'Contactar', next: 'CONTACTED' },
      { key: 'CONTACTED', label: 'Contactado', action: 'Agendar', next: 'APPOINTMENT_BOOKED' },
      { key: 'APPOINTMENT_BOOKED', label: 'Cita', action: 'Seguimiento', next: 'FOLLOW_UP' },
      { key: 'FOLLOW_UP', label: 'Seguimiento', action: 'Cerrar', next: 'CLOSED_WON' },
      { key: 'CLOSED_WON', label: 'Cerrado', action: 'Finalizado' },
    ],
    serviceCards: baseServiceCards('Cita', 'cliente'),
  },

  inmobiliaria: {
    label: 'Inmobiliaria',
    audienceNoun: 'interesado',
    appointmentNoun: 'Visita',
    metrics: [
      { key: 'totalLeads', label: 'Interesados totales', hint: 'Base de prospectos', accent: 'text-sky-600' },
      { key: 'newLeads', label: 'Nuevos prospectos', hint: 'Sin primer contacto', accent: 'text-emerald-600' },
      { key: 'appointments', label: 'Visitas próximas', hint: 'Visitas a propiedades', accent: 'text-violet-600' },
      { key: 'pendingReminders', label: 'Seguimientos', hint: 'Programados', accent: 'text-amber-600' },
      { key: 'todayAppointments', label: 'Visitas hoy', hint: 'Agenda del día', accent: 'text-rose-600' },
    ],
    pipeline: [
      { key: 'NEW', label: 'Prospecto', action: 'Calificar', next: 'CONTACTED' },
      { key: 'CONTACTED', label: 'Contactado', action: 'Agendar visita', next: 'APPOINTMENT_BOOKED' },
      { key: 'APPOINTMENT_BOOKED', label: 'Visita agendada', action: 'Negociar', next: 'FOLLOW_UP' },
      { key: 'FOLLOW_UP', label: 'Negociación', action: 'Cerrar', next: 'CLOSED_WON' },
      { key: 'CLOSED_WON', label: 'Cerrado / Arrendado', action: 'Finalizado' },
    ],
    serviceCards: baseServiceCards('Visita', 'interesado'),
  },

  drogueria: {
    label: 'Droguería',
    audienceNoun: 'comprador',
    appointmentNoun: 'Entrega',
    metrics: [
      { key: 'totalLeads', label: 'Clientes totales', hint: 'Base de compradores', accent: 'text-sky-600' },
      { key: 'newLeads', label: 'Nuevas solicitudes', hint: 'Sin primer contacto', accent: 'text-emerald-600' },
      { key: 'appointments', label: 'Pedidos en curso', hint: 'Entregas programadas', accent: 'text-violet-600' },
      { key: 'pendingReminders', label: 'Avisos', hint: 'Recordatorios de disponibilidad', accent: 'text-amber-600' },
      { key: 'todayAppointments', label: 'Entregas hoy', hint: 'Domicilios del día', accent: 'text-rose-600' },
    ],
    pipeline: [
      { key: 'NEW', label: 'Solicitud', action: 'Verificar stock', next: 'CONTACTED' },
      { key: 'CONTACTED', label: 'Atendido', action: 'Confirmar pedido', next: 'APPOINTMENT_BOOKED' },
      { key: 'APPOINTMENT_BOOKED', label: 'Pedido confirmado', action: 'Despachar', next: 'FOLLOW_UP' },
      { key: 'FOLLOW_UP', label: 'En camino', action: 'Cerrar', next: 'CLOSED_WON' },
      { key: 'CLOSED_WON', label: 'Entregado', action: 'Finalizado' },
    ],
    serviceCards: baseServiceCards('Entrega', 'comprador'),
  },

  retail: {
    label: 'Retail / Tienda',
    audienceNoun: 'comprador',
    appointmentNoun: 'Cita',
    metrics: [
      { key: 'totalLeads', label: 'Clientes totales', hint: 'Base de clientes', accent: 'text-sky-600' },
      { key: 'newLeads', label: 'Nuevas consultas', hint: 'Sin primer contacto', accent: 'text-emerald-600' },
      { key: 'appointments', label: 'Citas próximas', hint: 'Asesorías y recogidas', accent: 'text-violet-600' },
      { key: 'pendingReminders', label: 'Recordatorios', hint: 'Programados', accent: 'text-amber-600' },
      { key: 'todayAppointments', label: 'Hoy', hint: 'Citas del día', accent: 'text-rose-600' },
    ],
    pipeline: [
      { key: 'NEW', label: 'Consulta', action: 'Responder', next: 'CONTACTED' },
      { key: 'CONTACTED', label: 'Atendido', action: 'Cotizar', next: 'APPOINTMENT_BOOKED' },
      { key: 'APPOINTMENT_BOOKED', label: 'Cotización', action: 'Dar seguimiento', next: 'FOLLOW_UP' },
      { key: 'FOLLOW_UP', label: 'Seguimiento', action: 'Cerrar', next: 'CLOSED_WON' },
      { key: 'CLOSED_WON', label: 'Venta', action: 'Finalizado' },
    ],
    serviceCards: baseServiceCards('Cita', 'comprador'),
  },

  supermercado: {
    label: 'Supermercado',
    audienceNoun: 'comprador',
    appointmentNoun: 'Entrega',
    metrics: [
      { key: 'totalLeads', label: 'Clientes totales', hint: 'Base de compradores', accent: 'text-sky-600' },
      { key: 'newLeads', label: 'Nuevas solicitudes', hint: 'Sin primer contacto', accent: 'text-emerald-600' },
      { key: 'appointments', label: 'Pedidos próximos', hint: 'Entregas programadas', accent: 'text-violet-600' },
      { key: 'pendingReminders', label: 'Avisos', hint: 'Recordatorios programados', accent: 'text-amber-600' },
      { key: 'todayAppointments', label: 'Entregas hoy', hint: 'Domicilios del día', accent: 'text-rose-600' },
    ],
    pipeline: [
      { key: 'NEW', label: 'Solicitud', action: 'Atender', next: 'CONTACTED' },
      { key: 'CONTACTED', label: 'Atendido', action: 'Confirmar pedido', next: 'APPOINTMENT_BOOKED' },
      { key: 'APPOINTMENT_BOOKED', label: 'Pedido confirmado', action: 'Despachar', next: 'FOLLOW_UP' },
      { key: 'FOLLOW_UP', label: 'En camino', action: 'Cerrar', next: 'CLOSED_WON' },
      { key: 'CLOSED_WON', label: 'Entregado', action: 'Finalizado' },
    ],
    serviceCards: baseServiceCards('Entrega', 'comprador'),
  },
};

export function resolveIndustryConfig(segment?: string | null): IndustryConfig {
  const raw = (segment ?? 'general').trim().toLowerCase();
  if (raw in INDUSTRY_CONFIG) return INDUSTRY_CONFIG[raw as BusinessSegment];
  return INDUSTRY_CONFIG.general;
}
