#!/usr/bin/env node
/**
 * Verificacion END-TO-END base de datos <-> cliente Prisma. SOLO LECTURA.
 *
 * POR QUE EXISTE
 * --------------
 * Los otros dos scripts no responden la pregunta que importa para operar:
 *
 *   - `check-database-url.mjs` valida la FORMA de la URL.
 *   - `diag-db-connectivity.mjs`  valida RED + TLS + login (con `pg`).
 *   - `prisma migrate status`     valida el HISTORIAL de migraciones.
 *
 * Ninguno comprueba que la app pueda LEER los modelos que usa. Un desajuste
 * tipico: la base ya tiene las tablas (creadas con `db push`) pero el cliente
 * generado esta viejo, o falta un indice unico. Eso no se ve hasta que
 * produccion devuelve un 500. Aqui falla antes y con el nombre exacto.
 *
 * USO:    node scripts/verify-db-schema.mjs
 * SALIDA: 0 = todo responde; 1 = hay al menos un bloqueo (lista accionable).
 * No imprime credenciales y no escribe ni borra filas.
 */

import { PrismaClient } from '@prisma/client';
import { cargarEnvLocal, resolverUrl, avisosDeConflicto } from './check-database-url.mjs';

cargarEnvLocal(); // el entorno real manda; el .env solo rellena lo que falta
const hallado = resolverUrl();
if (!hallado) {
  console.error('[db-verify] Ninguna variable de conexion definida (DATABASE_URL / AIVEN_DATABASE_URL / POSTGRES_URL / DIRECT_URL).');
  process.exit(1);
}

for (const aviso of avisosDeConflicto()) console.warn(`[db-verify] ${aviso}`);

const prisma = new PrismaClient();
/** @type {{ nombre: string, ok: boolean, detalle: string }[]} */
const resultados = [];

/** Ejecuta una comprobacion y guarda el resultado sin abortar el resto. */
async function comprobar(nombre, fn) {
  try {
    const detalle = await fn();
    resultados.push({ nombre, ok: true, detalle: String(detalle ?? '') });
  } catch (e) {
    resultados.push({ nombre, ok: false, detalle: `${e.code ?? ''} ${String(e.message).split('\n')[0]}`.trim() });
  }
}

await comprobar('conexion y servidor', async () => {
  const [r] = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS usr, version() AS v`;
  return `${r.db} como ${r.usr} · ${String(r.v).split(' ').slice(0, 2).join(' ')}`;
});

await comprobar('historial de migraciones sin fallos', async () => {
  const [c] = await prisma.$queryRaw`SELECT count(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
  const fallidas = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL`;
  if (fallidas.length > 0) throw new Error(`migraciones en estado fallido: ${fallidas.map((f) => f.migration_name).join(', ')}`);
  return `${c.n} migraciones aplicadas, 0 fallidas`;
});

await comprobar('Tienda.agentVoice / agentVoiceLabel (voz del agente)', async () => {
  const filas = await prisma.tienda.findMany({ take: 1, select: { id: true, agentVoice: true, agentVoiceLabel: true } });
  const total = await prisma.tienda.count();
  const conVoz = await prisma.tienda.count({ where: { agentVoice: { not: null } } });
  if (total > 0 && filas.length === 0) throw new Error('la consulta de Tienda devolvio 0 filas aunque hay registros');
  return `2 columnas OK · ${total} sede(s), ${conVoz} con voz ya elegida`;
});

await comprobar('VoiceCloneAuthorization (evidencia de autorizacion)', async () => {
  const filas = await prisma.voiceCloneAuthorization.findMany({
    take: 1,
    select: {
      id: true,
      organizationId: true,
      tiendaId: true,
      consentingName: true,
      consentingDocument: true,
      purpose: true,
      scriptVersion: true,
      grantedAt: true,
      revokedAt: true,
      authorizationSha256: true,
      sampleSha256: true,
      sampleSeconds: true,
      voiceCloneId: true,
      createdByUserId: true,
    },
  });
  const vigentes = await prisma.voiceCloneAuthorization.count({ where: { revokedAt: null } });
  return `14 campos OK · ${vigentes} autorizacion(es) vigente(s)${filas.length === 0 ? ' (tabla vacia: aun no hay clones)' : ''}`;
});

await comprobar('VerticalOnboardingSession (onboarding no clinico)', async () => {
  await prisma.verticalOnboardingSession.findMany({
    take: 1,
    select: { userId: true, segment: true, status: true, currentStep: true, progressPercent: true, answers: true, caseRef: true, submittedAt: true },
  });
  const porEstado = await prisma.verticalOnboardingSession.groupBy({ by: ['status'], _count: { _all: true } });
  // El selector del indice unico([userId, segment]) lo valida el cliente; null = no existe.
  await prisma.verticalOnboardingSession.findUnique({ where: { userId_segment: { userId: '__verify__', segment: '__verify__' } } });
  const idx = await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='VerticalOnboardingSession' AND indexname='VerticalOnboardingSession_userId_segment_key'`;
  if (idx.length === 0) throw new Error('falta el indice unico userId_segment: el upsert del wizard fallaria en produccion');
  const resumen = porEstado.length ? porEstado.map((g) => `${g.status}=${g._count._all}`).join(' ') : 'sin sesiones';
  return `campos + enum + indice unico OK · ${resumen}`;
});

await comprobar('ApiClient (API pull de Identidad Conforme)', async () => {
  await prisma.apiClient.findMany({
    take: 1,
    select: { organizationId: true, clinicId: true, name: true, keyHash: true, keyPrefix: true, isActive: true, lastUsedAt: true, revokedAt: true },
  });
  const activas = await prisma.apiClient.count({ where: { isActive: true, revokedAt: null } });
  return `${activas} llave(s) activa(s)${activas === 0 ? ' -> sin llave, el modo API pull no puede autenticar' : ''}`;
});

console.log(`[db-verify] Variable usada: ${hallado.clave} (contenido nunca se imprime)`);
for (const r of resultados) console.log(`  ${r.ok ? 'OK   ' : 'FALLO'}  ${r.nombre.padEnd(52)} ${r.detalle}`);

const fallos = resultados.filter((r) => !r.ok);
if (fallos.length === 0) {
  console.log('\n[db-verify] La base responde a todos los modelos que usa la app.');
  process.exit(0);
}
console.log(`\n[db-verify] ${fallos.length} bloqueo(s): la app fallaria en esas rutas. Corrige antes de desplegar.`);
process.exit(1);
