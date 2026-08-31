/**
 * DocumentValidator — Máquina de Estados.
 * Estados: (sin doc) → SOLICITADO → RECIBIDO → VALIDADO/RECHAZADO → re-solicitar
 * Intercepta el agendamiento cuando la especialidad exige documentos, pausa el flujo
 * lógico y marca el estatus del paciente hasta completar la validación.
 */
import { prisma, sendWhatsApp, downloadMedia } from '../db';
import { emit } from '../realtime/events';
import { SchedulingController } from './SchedulingController';

export const DocumentValidator = {
  /**
   * Puerta de entrada del agendamiento: si la especialidad exige docs y el paciente
   * no los tiene validados, crea el registro SOLICITADO y PAUSA el flujo.
   */
  async interceptarSiAplica(pacienteId: string, especialidadId: string, telefono: string): Promise<boolean> {
    const esp = await prisma.especialidad.findUnique({ where: { id: especialidadId } });
    if (!esp) return false;

    const yaValidado = await prisma.documento.findFirst({
      where: { pacienteId, estado: 'VALIDADO' },
    });
    if (!esp.requiereOrden && !esp.requiereCedula) return false; // no exige docs → flujo libre
    if (yaValidado) return false;                                // ya los tiene → flujo libre

    const tiposNecesarios = [
      ...(esp.requiereCedula ? ['CEDULA'] : []),
      ...(esp.requiereOrden ? ['ORDEN_MEDICA'] : []),
    ];

    for (const tipo of tiposNecesarios) {
      await prisma.documento.create({ data: { pacienteId, tipo, estado: 'SOLICITADO' } });
    }
    await prisma.paciente.update({ where: { id: pacienteId }, data: { estatus: 'ESPERANDO_DOCUMENTOS' } });

    const lista = tiposNecesarios
      .map((t) => (t === 'CEDULA' ? '📄 tu cédula' : '📋 la orden médica de tu EPS'))
      .join(' y ');
    await sendWhatsApp(telefono,
      `Para agendar ${esp.nombre} necesito que me envíes ${lista} como imagen. ` +
      'En cuanto las reciba, continúo con tu cita automáticamente.');
    emit('documento_solicitado', { pacienteId, tipos: tiposNecesarios });
    return true; // flujo pausado
  },

  /** RECIBIDO → (validación) → VALIDADO | RECHAZADO. Al validar, reanuda el agendamiento. */
  async recibirDocumento(pacienteId: string, tipo: string, mediaId: string) {
    const path = await downloadMedia(mediaId, pacienteId);

    const doc = await prisma.documento.findFirst({
      where: { pacienteId, tipo, estado: { in: ['SOLICITADO', 'RECHAZADO'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) return;

    await prisma.documento.update({ where: { id: doc.id }, data: { estado: 'RECIBIDO', path } });
    await prisma.paciente.update({ where: { id: pacienteId }, data: { estatus: 'ESPERANDO_DOCUMENTOS' } });
    emit('documento_recibido', { pacienteId, tipo, path });

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });

    // Politica: imágenes de cédula pasan auto-validación básica; órdenes médicas → recepcionista.
    if (tipo === 'CEDULA') {
      await prisma.documento.update({ where: { id: doc.id }, data: { estado: 'VALIDADO' } });
      emit('documento_validado', { pacienteId, tipo });
    } else {
      await sendWhatsApp(paciente!.telefono,
        `✅ Recibí tu documento (${tipo}). Lo está revisando recepción ahora mismo. Te aviso enseguida.`);
    }

    // ¿Quedan documentos pendientes? Si no, liberar paciente y reanudar cita.
    const pendientes = await prisma.documento.count({
      where: { pacienteId, estado: { in: ['SOLICITADO', 'RECIBIDO', 'RECHAZADO'] } },
    });
    if (pendientes === 0) {
      const pacienteValidado = await prisma.paciente.update({
        where: { id: pacienteId },
        data: { estatus: 'DOCUMENTOS_VALIDADOS' },
      });
      await sendWhatsApp(pacienteValidado.telefono,
        '🎉 ¡Documentos completos! Continúo con tu agendamiento.');
      // Reanuda el flujo que quedó pausado: agenda en la especialidad original
      const ultimaEspera = await prisma.listaEspera.findFirst({
        where: { pacienteId }, orderBy: { fechaDesde: 'desc' },
      });
      if (ultimaEspera) {
        await SchedulingController.solicitarCita(pacienteId, 'continuar agendamiento', ultimaEspera.especialidadId);
      }
    }
  },

  /** Acción de RECEPCIONISTA (RBAC): validar o rechazar una orden médica. */
  async decidir(documentoId: string, revisadoPor: string, aprobar: boolean, motivo?: string) {
    const doc = await prisma.documento.update({
      where: { id: documentoId },
      data: { estado: aprobar ? 'VALIDADO' : 'RECHAZADO', revisadoPor },
    });
    const paciente = await prisma.paciente.findUnique({ where: { id: doc.pacienteId } });

    if (aprobar) {
      emit('documento_validado', { pacienteId: doc.pacienteId, tipo: doc.tipo });
      await sendWhatsApp(paciente!.telefono, `✅ Tu documento fue validado. ¡Continuamos!`);
    } else {
      await prisma.documento.create({
        data: { pacienteId: doc.pacienteId, tipo: doc.tipo, estado: 'SOLICITADO' },
      });
      await sendWhatsApp(paciente!.telefono,
        `⚠️ No pude validar tu documento${motivo ? `: ${motivo}` : ''}. Por favor envíalo de nuevo, mejor iluminado y completo.`);
      emit('documento_rechazado', { pacienteId: doc.pacienteId, tipo: doc.tipo, motivo });
    }
    return doc;
  },
};
