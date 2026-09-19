/**
 * Resolucion de la URL de base de datos (Aiven PostgreSQL).
 *
 * Contexto: la app migro de Neon (capa gratuita agotada) a Aiven. La conexion
 * vive en una sola variable, pero durante la migracion algunos entornos
 * quedaron con nombres distintos. Este modulo centraliza la resolucion para que
 * `lib/prisma.ts`, `lib/listener.ts` y `app/layout.tsx` usen exactamente la
 * misma logica y no puedan divergir.
 *
 * Orden de precedencia: el primero que tenga valor gana.
 *   DATABASE_URL      -> nombre canonico (declarado en prisma/schema.prisma)
 *   AIVEN_DATABASE_URL-> alias usado durante la migracion a Aiven
 *   POSTGRES_URL      -> alias heredado
 *   DIRECT_URL        -> alias heredado (endpoint directo, sin pooler)
 * 
 * Nota Aiven: el endpoint que entrega el panel es una conexion directa (no hay
 * endpoint de pooler separado), asi que ambas variables apuntan al mismo host.
 * Ver render.yaml para las variables declaradas en el despliegue.
 */

const DATABASE_URL_ENV_KEYS = [
  'DATABASE_URL',
  'AIVEN_DATABASE_URL',
  'POSTGRES_URL',
  'DIRECT_URL',
] as const;

/** Devuelve la primera URL de base de datos configurada, o undefined si no hay. */
export function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** true si hay alguna URL de base de datos configurada. */
export function hasDatabaseUrl(): boolean {
  return Boolean(resolveDatabaseUrl());
}