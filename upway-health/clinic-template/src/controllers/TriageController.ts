/**
 * TriageController — primer eslabón del flujo clínico.
 * Clasifica la intención con el LLM LOCAL (Ollama: los datos médicos nunca salen del piso)
 * y enruta: consulta_operativa (RAG) | agendar | cancelar | emergencia (→ humano).
 */
import { prisma, sendWhatsApp } from '../db';
import { emit } from '../realtime/events';
import { SchedulingController } from './SchedulingController';
import { DocumentValidator } from './DocumentValidator';

export type Intencion = 'consulta_operativa' | 'agendar' | 'cancelar' | 'emergencia' | 'desconocido';

const OLLAMA = process.env.OLLAMA_URL || 'http://ollama:11434';
const MODEL = process.env.LLM_MODEL || 'llama3.1:8b';

export async function clasificar(texto: string): Promise<Intencion> {
  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: `Clasifica el mensaje de un paciente en UNA etiqueta sin explicación:
[consulta_operativa|agendar|cancelar|emergencia|desconocido]
Criterios: emergencia = dolor intenso, sangrado, dificultad respiratoria, urgencia vital.
agendar = quiere cita/turno. cancelar = anular/reprogramar. consulta_operativa = horarios, dirección, EPS, precios, exámenes.
Mensaje: "${texto}"`,
      stream: false,
      options: { temperature: 0, num_predict: 12 },
    }),
  });
  const data: any = await res.json();
  const etiqueta = String(data.response || '').match(/consulta_operativa|agendar|cancelar|emergencia|desconocido/)?.[0];
  return (etiqueta as Intencion) ?? 'desconocido';
}

export const TriageController = {
  async procesar(ctx: { telefono: string; nombre: string; texto: string; mensajeMetaId: string; tipo: string; mediaId?: string }) {
    // 1. Upsert del paciente + bitácora (auditoría clínica)
    const paciente = await prisma.paciente.upsert({
      where: { telefono: ctx.telefono },
      update: {},
      create: { telefono: ctx.telefono, nombre: ctx.nombre },
    });
    await prisma.mensaje.create({ data: { pacienteId: paciente.id, direccion: 'IN', contenido: ctx.texto } });

    // 2. Si hay documentos pendientes, la máquina de estados los intercepta ANTES que todo
    const docPendiente = await prisma.documento.findFirst({
      where: { pacienteId: paciente.id, estado: { in: ['SOLICITADO', 'RECIBIDO', 'RECHAZADO'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (docPendiente && ctx.tipo === 'image' && ctx.mediaId) {
      return DocumentValidator.recibirDocumento(paciente.id, docPendiente.tipo, ctx.mediaId);
    }

    // 3. Clasificación de intención con el LLM local
    const intencion = await clasificar(ctx.texto);
    emit('triage_clasificado', { pacienteId: paciente.id, intencion, texto: ctx.texto });

    switch (intencion) {
      case 'emergencia': {
        // 🔴 ESCALADO A HUMANO: nunca un LLM maneja una urgencia
        await sendWhatsApp(ctx.telefono,
          '🚨 Por tu seguridad te estoy transfiriendo de inmediato con personal médico. ' +
          'Si es una emergencia vital, llama al 123 ahora mismo.');
        emit('emergencia_detectada', { pacienteId: paciente.id, telefono: ctx.telefono, texto: ctx.texto });
        return;
      }
      case 'agendar':
        return SchedulingController.solicitarCita(paciente.id, ctx.texto);
      case 'cancelar':
        return SchedulingController.cancelar(paciente.id, ctx.telefono);
      case 'consulta_operativa':
        return this.responderOperativa(paciente.id, ctx.telefono, ctx.texto);
      default:
        await sendWhatsApp(ctx.telefono,
          '👋 Hola, soy la asistente de la clínica. Puedo ayudarte a agendar citas, resolver ' +
          'dudas de horarios y dirección, o transferirte con el equipo médico. ¿En qué te ayudo?');
    }
  },

  /** RAG operativo: las respuestas se basan SOLO en la base de conocimiento de esta clínica. */
  async responderOperativa(pacienteId: string, telefono: string, pregunta: string) {
    const faqs = await prisma.conocimiento.findMany({ take: 30 });
    const contexto = faqs.map((f) => `P: ${f.pregunta}\nR: ${f.respuesta}`).join('\n');

    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        system: `Eres la asistente de la clínica. Responde SOLO con esta información. Si no está, ofrece transferirte a recepción.\n${contexto}`,
        prompt: pregunta,
        stream: false,
        options: { temperature: 0.2, num_predict: 200 },
      }),
    });
    const data: any = await res.json();
    const respuesta = String(data.response || 'No tengo ese dato, ¿te transfiero con recepción?').trim();

    await sendWhatsApp(telefono, respuesta);
    await prisma.mensaje.create({ data: { pacienteId, direccion: 'OUT', contenido: respuesta } });
  },
};
