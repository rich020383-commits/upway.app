import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl, assertDatabaseUrlWellFormed } from '@/lib/database-url';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function failFastNoDatabase() {
  // C1: en producción prohibimos el proxy silencioso. Sin DB el boot debe fallar
  // con mensaje claro en vez de devolver null/[] y fingir "sin datos".
  if (process.env.NODE_ENV === 'production' && !resolveDatabaseUrl()) {
    throw new Error(
      '[prisma] Falta DATABASE_URL (o AIVEN_DATABASE_URL/POSTGRES_URL/DIRECT_URL). ' +
      'Configúrala en Render antes de arrancar.'
    );
  }
}

function createClient(): PrismaClient {
  failFastNoDatabase();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    // Solo desarrollo sin DB: devolvemos proxy seguro para no romper el landing.
    // Cualquier acceso real a datos devolverá null/[] en vez de crashear el HMR.
    const safeModel = (): unknown =>
      new Proxy(async () => null, {
        apply: async () => null,
        get: (_t, prop) => {
          if (typeof prop === 'string' && prop.startsWith('$')) return async () => undefined;
          if (prop === 'findFirst') return async () => null;
          if (prop === 'findMany') return async () => [];
          if (prop === 'create') return async () => null;
          if (prop === 'update') return async () => null;
          if (prop === 'delete') return async () => null;
          if (prop === 'count') return async () => 0;
          return safeModel();
        },
      });
    return new Proxy({} as PrismaClient, {
      get: (_t, prop) => {
        if (typeof prop === 'string' && prop.startsWith('$')) return async () => undefined;
        return safeModel();
      },
    });
  }
    // Validación de integridad de la URL ANTES de crear el cliente.
  // En producción: si DATABASE_URL está corrupta (query string dentro del
  // hostname, pool_timeout absurdo), Prisma lanza un error oscuro
  // ("Can't reach database server"). Aquí fallamos fast con un mensaje
  // diagnóstico. Ver REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md.
  if (process.env.NODE_ENV === 'production') {
    assertDatabaseUrlWellFormed(databaseUrl);
  }
  // Datasource explícito: Prisma Client sólo lee `DATABASE_URL` del schema, así
  // que inyectamos la URL resuelta para que los alias (AIVEN_DATABASE_URL,
  // POSTGRES_URL, DIRECT_URL) también funcionen en tiempo de ejecución.
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

