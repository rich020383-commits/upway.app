import type { ReactNode } from 'react';
import { CalendarRange, Headphones, MessageCircleMore, ShieldCheck } from 'lucide-react';

export interface ModuloDefinicion {
  id: string;
  titulo: string;
  descripcion: string;
  esBase: boolean;
  capacidades: string[];
  icon: ReactNode;
}

export const MODULO_DEFINICIONES: Record<string, ModuloDefinicion> = {
  workspace: {
    id: 'workspace',
    titulo: 'Centro de Control de Negocio',
    descripcion: 'La base para organizar a tu equipo y asegurar que ninguna oportunidad de venta o atención se quede sin respuesta.',
    esBase: true,
    capacidades: [
      'Chat centralizado para todo el equipo de asesores.',
      'Tablero visual para gestionar el estado de cada cliente.',
      'Asignación clara de responsables por cada cuenta.',
      'Historial completo de la trazabilidad operativa.'
    ],
    icon: <ShieldCheck size={28} className="text-slate-900" />
  },
  agenda: {
    id: 'agenda',
    titulo: 'Agenda Operativa Inteligente',
    descripcion: 'Coordina la disponibilidad de especialistas y espacios sin enredos ni cruces de horarios.',
    esBase: true,
    capacidades: [
      'Programación de citas enlazada al flujo de chat.',
      'Control de turnos y disponibilidad por especialista.',
      'Seguimiento estricto de asistencias y reprogramaciones.',
      'Registro de notas y ubicación por cita.'
    ],
    icon: <CalendarRange size={28} className="text-slate-900" />
  },
  whatsapp: {
    id: 'whatsapp',
    titulo: 'Empleado Digital: WhatsApp IA',
    descripcion: 'Atiende, califica y perfila clientes en piloto automático 24/7 a través de mensajería.',
    esBase: false,
    capacidades: [
      'Captura y perfilamiento automático de leads 24/7.',
      'Recordatorios inteligentes para asegurar la asistencia.',
      'Contexto de negocio persistente en cada interacción.',
      'Derivación fluida hacia el cierre o la agenda.'
    ],
    icon: <MessageCircleMore size={28} />
  },
  voz: {
    id: 'voz',
    titulo: 'Empleado Digital: Voz IA',
    descripcion: 'Recepcionista telefónica autónoma con voz natural para gestionar llamadas de alta demanda.',
    esBase: false,
    capacidades: [
      'Atención de llamadas entrantes con naturalidad.',
      'Agendamiento de citas en tiempo real por voz.',
      'Transferencia inteligente a asesores humanos.',
      'Gestión controlada de llamadas simultáneas.'
    ],
    icon: <Headphones size={28} />
  }
};

export const MODULO_LISTA = Object.values(MODULO_DEFINICIONES);

export const MODULO_DETALLES: Record<string, { nombre: string; precio: number }> = {
  whatsapp: { nombre: 'Motor WhatsApp (Texto)', precio: 399900 },
  voz: { nombre: 'Motor Central Telefónica', precio: 599900 },
  calendario: { nombre: 'Sincronización Agenda', precio: 39000 },
  analitica: { nombre: 'Analítica Empresarial', precio: 19000 },
  rag: { nombre: 'Cerebro RAG (Omnicanal)', precio: 0 }
};
