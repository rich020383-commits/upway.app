/**
 * SchedulingController — reserva transaccional + mensajes de preparación automáticos.
 * - Reserva el turno en la BD con control de colisiones (unique [medicoId, fechaHora])
 * - Programa el mensaje de preparación de la especialidad (ej. "venir en ayunas")
 * - Emite eventos en vivo al dashboard
 */
import { Queue } from 'bullmq';
import { prisma, sendWhatsApp } from '../db';
import { emit } from '../realtime/events';
import { DocumentValidator } from './DocumentValidator';

const redisHost = process.env.REDIS_HOST || 'redis';

/** Cola para mensajes diferidos de preparación (48h antes / 24h antes / día previo). */
export const prepQueue = new Queue('prep-messages', {
  connection: { host: redisHost },
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 200 },
});

export const SchedulingController = {
  /** Paso 1: el paciente quiere agendar → averiguar especialidad y pasar por el filtro de documentos. */
  async solicitarCita(pacienteId: string, texto: string, especialidadIdForzada?: string) {
    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente) return;

    let espId = especialidadIdForzada;
    if (!espId) {
      // Match simple contra el catálogo de la clínica (en producción: embedding del LLM local)
      const especialidades = await prisma.especialidad.findMany();
      espId = especialidades.find((e) => texto.toLowerCase().includes(e.nombre.toLowerCase().split(' ')[0]))?.id;
      if (!espId) {
        const lista = especialidades.map((e) => `• ${e.nombre}`).join('\n');
        await sendWhatsApp(paciente.telefono, `Claro, ¿para qué especialidad?\n${lista}`);
        return;
      }
    }

    // 🛂 DocumentValidator: si exige documentos, PAUSA aquí y el flujo se reanuda al validarlos
    const pausado = await DocumentValidator.interceptarSiAplica(pacienteId, espId, paciente.telefono);
    if (pausado) return;

    return this.reservar(pacienteId, espId);
  },

  /** Paso 2: reserva transaccional del primer hueco disponible. */
  async reservar(pacienteId: string, especialidadId: string) {
    const esp = await prisma.especialidad.findUniqueOrThrow({ where: { id: especialidadId } });
    const paciente = await prisma.paciente.findUniqueOrThrow({ where: { id: pacienteId } });

    // Próximo hueco: franjas de 30 min a partir de mañana 7am, en los médicos de la especialidad
    const medicos = await prisma.usuario.findMany({ where: { especialidadId, rol: 'MEDICO', activo: true } });
    if (medicos.length === 0) {
      // Sin médicos activos: el paciente entra a lista de espera y el worker lo contactará
      await prisma.listaEspera.create({ data: { pacienteId, especialidadId } });
      await sendWhatsApp(paciente.telefono, 'No hay agenda disponible aún. Te apunté en lista de espera y te aviso apenas se libere un cupo. 🙌');
      emit('paciente_en_espera', { pacienteId, especialidadId });
      return;
    }

    const base = new Date(); base.setDate(base.getDate() + 1); base.setHours(7, 0, 0, 0);
    let asignado: { turnoId: string; fechaHora: Date; medicoNombre: string } | null = null;

    for (let dia = 0; dia < 14 && !asignado; dia++) {
      for (const medico of medicos) {
        for (let franja = 0; franja < 12 && !asignado; franja++) {
          const fechaHora = new Date(base); fechaHora.setDate(base.getDate() + dia);
          fechaHora.setMinutes(franja * esp.duracionMin);
          if (fechaHora.getHours() < 7 || fechaHora.getHours() >= 17) continue;
          try {
            const turno = await prisma.turno.create({
              data: {
                pacienteId, especialidadId,
                medicoId: medico.id,
                fechaHora,
                requiereDocs: esp.requiereOrden,
              },
            });
            asignado = { turnoId: turno.id, fechaHora, medicoNombre: medico.nombre };
          } catch { /* P2002: franja ocupada → siguiente */ }
        }
      }
    }

    if (!asignado) {
      await prisma.listaEspera.create({ data: { pacienteId, especialidadId } });
      await sendWhatsApp(paciente.telefono, 'La agenda está llena por ahora. Te puse en lista de espera prioritaria. 🙌');
      emit('paciente_en_espera', { pacienteId, especialidadId });
      return;
    }

    const fecha = asignado.fechaHora.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
    await sendWhatsApp(paciente.telefono, `✅ Cita de ${esp.nombre} reservada:\n📅 ${fecha}\n👨‍⚕️ ${asignado.medicoNombre}\n\nTe recordaré 48 horas antes para confirmar.`);

    // ⏰ Mensaje de preparación automático (ej. "venir en ayunas 8 horas")
    if (esp.indicaciones) {
      const confirmarEn = new Date(asignado.fechaHora.getTime() - 48 * 3600_000);
      await prepQueue.add('confirmar', { turnoId: asignado.turnoId }, { delay: Math.max(0, confirmarEn.getTime() - Date.now()) });
      const preparacionEn = new Date(asignado.fechaHora.getTime() - 24 * 3600_000);
      await prepQueue.add('preparacion', { turnoId: asignado.turnoId }, { delay: Math.max(0, preparacionEn.getTime() - Date.now()) });
    }

    emit('turno_reservado', {
      turnoId: asignado.turnoId, pacienteId, especialidad: esp.nombre,
      fechaHora: asignado.fechaHora.toISOString(), medico: asignado.medicoNombre,
    });
  },

  /** Cancelación: libera el turno y dispara el rescate automático desde lista de espera. */
  async cancelar(pacienteId: string, telefono: string) {
    const turno = await prisma.turno.findFirst({
      where: { pacienteId, estado: { in: ['RESERVADO', 'CONFIRMADO'] }, fechaHora: { gte: new Date() } },
      orderBy: { fechaHora: 'asc' },
    });
    if (!turno) {
      await sendWhatsApp(telefono, 'No encontré citas activas a tu nombre. ¿Deseas agendar una nueva?');
      return;
    }

    await prisma.turno.update({ where: { id: turno.id }, data: { estado: 'CANCELADO' } });
    await sendWhatsApp(telefono, 'Tu cita fue cancelada. El cupo se ofrecerá automáticamente al siguiente paciente en espera. ¿Te ayudo con algo más?');
    emit('turno_cancelado', { turnoId: turno.id, pacienteId, especialidadId: turno.especialidadId });

    // 🔁 MAGIA AUTÓNOMA: el hueco libre se reasigna YA (worker AutoFillWaitlist)
    const { autofillWaitlist } = await import('../workers/noShowWorker');
    await autofillWaitlist(turno.especialidadId);
  },
};
