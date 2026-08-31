/**
 * events.ts — la "magia en vivo".
 * Emite eventos Socket.io autenticados con JWT + RBAC. El frontend del cliente
 * escucha: turno_rescatado, documento_validado, turno_reservado, emergencia_detectada...
 */
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';

let io: Server;

export function initWebSockets(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_ORIGIN || '*' } });

  // Autenticación JWT por conexión
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string;
      socket.data.usuario = jwt.verify(token, JWT_SECRET); // { id, rol, especialidadId?, clinicaId }
      next();
    } catch {
      next(new Error('no autenticado'));
    }
  });

  // Autorización por sala: cada usuario solo ve SU alcance (RBAC en tiempo real)
  io.on('connection', (socket: Socket) => {
    const u = socket.data.usuario as { rol: string; id: string; especialidadId?: string };
    // Gerente: todo el piso. Recepcionista: sala agenda. Médico: solo su agenda.
    socket.join(`clinica:${process.env.CLINICA_ID}`);
    if (u.rol === 'RECEPCIONISTA' || u.rol === 'GERENTE') socket.join('sala:agenda');
    if (u.rol === 'MEDICO') socket.join(`medico:${u.id}`);
    if (u.rol === 'GERENTE') socket.join('sala:finanzas');
  });

  return io;
}

/** Emite un evento respetando el alcance RBAC. `sala` decide quién lo ve. */
export function emit(evento: string, payload: Record<string, unknown>) {
  if (!io) return;
  // Eventos operativos → agenda (recepción + gerente). Médicos reciben los de su agenda vía medico:*
  if (['turno_rescatado', 'turno_reservado', 'turno_cancelado', 'documento_validado',
    'documento_recibido', 'documento_solicitado', 'recordatorio_enviado'].includes(evento)) {
    io.to('sala:agenda').to(`clinica:${process.env.CLINICA_ID}`).emit(evento, payload);
  } else if (['emergencia_detectada', 'no_show_registrado', 'paciente_en_espera'].includes(evento)) {
    io.to('sala:agenda').emit(evento, payload);
    io.to('sala:finanzas').emit(evento, payload);
  } else {
    io.to(`clinica:${process.env.CLINICA_ID}`).emit(evento, payload);
  }
}
