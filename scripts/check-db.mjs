/**
 * Diagnóstico de estado de la base de datos.
 *
 * SOLO LECTURA: hace un SELECT 1 y consulta el catálogo pg_tables.
 * No escribe, no migra y no borra nada.
 *
 * Uso:
 *   node --env-file=.env scripts/check-db.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TABLAS_ESPERADAS = [
  'ScheduleResource',
  'ServiceOffering',
  'ResourceService',
  'AvailabilityRule',
  'AvailabilityException',
  'AppointmentHold',
  'AgendaAppointment',
  'WaitlistEntry',
  'AgendaAuditEvent',
];

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log('CONEXION=OK');

  const filas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const existentes = new Set(filas.map((f) => f.tablename));

  const presentes = TABLAS_ESPERADAS.filter((t) => existentes.has(t));
  const faltantes = TABLAS_ESPERADAS.filter((t) => !existentes.has(t));

  console.log('TABLAS_AGENDA_PRESENTES=' + presentes.length + '/' + TABLAS_ESPERADAS.length);
  if (faltantes.length) {
    console.log('FALTANTES=' + faltantes.join(', '));
  } else {
    console.log('ESQUEMA_AGENDA=completo');
  }
  console.log('TABLAS_PUBLICAS_TOTAL=' + existentes.size);
} catch (error) {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.log('CONEXION=FALLO');
  console.log('MENSAJE=' + mensaje.split('\n').filter((l) => l.trim()).slice(0, 6).join(' | '));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}