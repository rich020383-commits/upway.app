/**
 * Retención de tablas de auditoría y temporales.
 *
 * Las tablas de logs crecen de forma indefinida y compiten contra la cuota de
 * almacenamiento del plan gratuito (0.5 GB por proyecto). Este script aplica una
 * ventana de retención y limpia los apartados de cupo vencidos.
 *
 * Por defecto SOLO INFORMA (dry-run). Para borrar de verdad hay que pasar --apply.
 *
 * Uso:
 *   node --env-file=.env scripts/prune-audit-logs.mjs
 *   node --env-file=.env scripts/prune-audit-logs.mjs --apply
 *   AUDIT_RETENTION_DAYS=30 node --env-file=.env scripts/prune-audit-logs.mjs --apply
 *
 * Nunca toca datos de negocio: conversaciones, mensajes, leads, citas, usuarios,
 * facturación de llamadas ni ningún registro operativo.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const apply = process.argv.includes('--apply');

const retentionDays = (() => {
  const raw = Number(process.env.AUDIT_RETENTION_DAYS ?? '90');
  if (!Number.isFinite(raw) || raw < 1) return 90;
  return Math.min(Math.floor(raw), 3650);
})();

const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

async function countAndPrune(label, countFn, deleteFn) {
  const total = await countFn();
  if (total === 0) {
    console.log(`${label}: 0 registros fuera de la ventana (retención ${retentionDays} días)`);
    return 0;
  }
  if (!apply) {
    console.log(`${label}: ${total} registros se borrarían (retención ${retentionDays} días)`);
    return total;
  }
  const borrados = await deleteFn();
  const cantidad = typeof borrados?.count === 'number' ? borrados.count : total;
  console.log(`${label}: ${cantidad} registros borrados`);
  return cantidad;
}

async function main() {
  console.log(`Modo: ${apply ? 'APLICAR (borra)' : 'DRY-RUN (solo informa)'}`);
  console.log(`Ventana de retención: ${retentionDays} días (corte ${cutoff.toISOString()})`);
  console.log('');

  await countAndPrune(
    'WebhookEventLog',
    () => prisma.webhookEventLog.count({ where: { createdAt: { lt: cutoff } } }),
    () => prisma.webhookEventLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  );

  await countAndPrune(
    'HealthAuditLog',
    () => prisma.healthAuditLog.count({ where: { createdAt: { lt: cutoff } } }),
    () => prisma.healthAuditLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  );

  await countAndPrune(
    'AgendaAuditEvent',
    () => prisma.agendaAuditEvent.count({ where: { createdAt: { lt: cutoff } } }),
    () => prisma.agendaAuditEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })
  );

  const ahora = new Date();
  await countAndPrune(
    'AppointmentHold vencidos',
    () => prisma.appointmentHold.count({ where: { expiresAt: { lt: ahora } } }),
    () => prisma.appointmentHold.deleteMany({ where: { expiresAt: { lt: ahora } } })
  );

  if (!apply) {
    console.log('');
    console.log('Nada se ha borrado. Para aplicar: añade --apply');
  }
}

main()
  .catch((error) => {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Fallo el mantenimiento:', mensaje);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
