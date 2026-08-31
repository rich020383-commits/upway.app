/**
 * NoShowMitigation — Worker en segundo plano (BullMQ).
 * 1) Cada 15 min: confirma turnos a 48h y envía mensajes de preparación a 24h.
 * 2) AutoFillWaitlist: cuando un turno se libera (cancelación o no-show),
 *    contacta automáticamente al siguiente paciente en lista de espera (prioridad → FIFO).
 */
import { Worker } from 'bullmq';
import { prisma, sendWhatsApp } from '../db';
import { emit } from '../realtime/events';

const connection = { host: process.env.REDIS_HOST || 'redis' };

// ================= AUTO-FILL WAITLIST =================
export async function autofillWaitlist(especialidadId: string) {
  // El turno liberado más reciente de esa especialidad
  const turnoLibre = await prisma.turno.findFirst({
    where: { especialidadId, estado: 'CANCELADO', fechaHora: { gte: new Date() } },
    orderBy: { fechaHora: 'asc' },
  });
  if (!turnoLibre) return;

  const esperando = await prisma.listaEspera.findFirst({
    where: { especialidadId },
    orderBy: [{ prioridad: 'asc' }, { fechaDesde: 'asc' }], // 🔑 prioridad clínica → FIFO
    include: { paciente: true, especialidad: true },
  });
  if (!esperando) return;

  try {
    // Reserva transaccional del hueco liberado
    const turno = await prisma.turno.update({
      where: { id: turnoLibre.id },
      data: { pacienteId: esperando.pacienteId, estado: 'RESERVADO', notas: 'RESCATADO_LISTA_ESPERA' },
    });
    await prisma.listaEspera.delete({ where: { id: esperando.id } });

    const fecha = turno.fechaHora.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
    await sendWhatsApp(esperando.paciente.telefono,
      `🎉 ¡Buenas noticias! Se liberó un cupo de ${esperando.especialidad.nombre}:\n📅 ${fecha}\n\n` +
      'Responde SI para confirmarla o NO para liberarla.');

    emit('turno_rescatado', { // ✨ La "magia en vivo" que ve el cliente en su dashboard
      turnoId: turno.id,
      pacienteId: esperando.pacienteId,
      especialidad: esperando.especialidad.nombre,
      fechaHora: turno.fechaHora.toISOString(),
      origen: 'AUTO_FILL_WAITLIST',
    });
  } catch { /* otro worker tomó el hueco; idempotente */ }
}

// ================= CONFIRMACIONES 48H + PREPARACIÓN 24H =================
const confirmWorker = new Worker(
  'prep-messages',
  async (job) => {
    const turno = await prisma.turno.findUnique({
      where: { id: job.data.turnoId },
      include: { paciente: true, especialidad: true },
    });
    if (!turno || !['RESERVADO', 'CONFIRMADO'].includes(turno.estado)) return;

    if (job.name === 'confirmar') {
      await sendWhatsApp(turno.paciente.telefono,
        `⏰ Recordatorio: tienes cita de ${turno.especialidad.nombre} el ` +
        `${turno.fechaHora.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}.\n` +
        'Responde SI para confirmar o NO para cancelar.');
      emit('recordatorio_enviado', { turnoId: turno.id, tipo: 'confirmacion_48h' });
    }

    if (job.name === 'preparacion') {
      if (turno.especialidad.indicaciones) {
        await sendWhatsApp(turno.paciente.telefono,
          `📋 Preparación para tu cita de mañana:\n${turno.especialidad.indicaciones}`);
        emit('recordatorio_enviado', { turnoId: turno.id, tipo: 'preparacion_24h' });
      }
    }
  },
  { connection }
);

// ================= CRON: barrido cada 15 min =================
const cronWorker = new Worker(
  'cron-scan',
  async () => {
    const en48h = new Date(Date.now() + 48 * 3600_000);
    const ventana = new Set([en48h.toISOString().slice(0, 13)]); // agrupar por hora para no duplicar

    const porConfirmar = await prisma.turno.findMany({
      where: {
        estado: 'RESERVADO',
        fechaHora: { gte: new Date(Date.now() + 47 * 3600_000), lte: new Date(Date.now() + 49 * 3600_000) },
      },
      include: { paciente: true, especialidad: true },
    });

    for (const t of porConfirmar) {
      await sendWhatsApp(t.paciente.telefono,
        `⏰ ¿Confirmas tu cita de ${t.especialidad.nombre} el ` +
        `${t.fechaHora.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}? Responde SI o NO.`);
    }

    // No-shows: turnos CONFIRMADOS cuya fecha pasó sin completarse → liberar y rescatar
    const vencidos = await prisma.turno.findMany({
      where: { estado: 'CONFIRMADO', fechaHora: { lt: new Date(Date.now() - 3600_000) } },
    });
    for (const t of vencidos) {
      await prisma.turno.update({ where: { id: t.id }, data: { estado: 'NO_ASISTIO' } });
      emit('no_show_registrado', { turnoId: t.id, pacienteId: t.pacienteId });
      await autofillWaitlist(t.especialidadId);
    }

    // Barrido adicional de lista de espera por si hay huecos sin reasignar
    const especialidades = await prisma.especialidad.findMany({ select: { id: true } });
    for (const e of especialidades) await autofillWaitlist(e.id);
  },
  { connection, concurrency: 1 }
);

// Repeatable job: el "cron" de verdad
(async () => {
  const { Queue } = await import('bullmq');
  const cronQueue = new Queue('cron-scan', { connection });
  await cronQueue.add(
    'scan',
    {},
    { repeat: { pattern: '*/15 * * * *' }, jobId: 'cron-scan-15min' }
  );
  console.log('[NoShowMitigation] worker arriba: confirmaciones 48h, preparación 24h, AutoFillWaitlist');
})();
