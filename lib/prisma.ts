import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DIRECT_URL,
);

function failFastNoDatabase() {
  // C1: en producción prohibimos el proxy silencioso. Sin DB el boot debe fallar
  // con mensaje claro en vez de devolver null/[] y fingir "sin datos".
  if (process.env.NODE_ENV === 'production' && !hasDatabaseUrl) {
    throw new Error(
      '[prisma] Falta DATABASE_URL (o POSTGRES_URL/NEON_DATABASE_URL/DIRECT_URL). ' +
      'Configúrala en Render antes de arrancar.'
    );
  }
}

function createClient(): PrismaClient {
  failFastNoDatabase();
  if (!hasDatabaseUrl) {
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
  return new PrismaClient();
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

