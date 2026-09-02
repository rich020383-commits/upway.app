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

const safePrismaModel = () =>
  new Proxy(
    async () => null,
    {
      apply: async () => null,
      get: (_target, prop) => {
        if (typeof prop === 'string' && prop.startsWith('$')) {
          return async () => undefined;
        }

        if (prop === 'findFirst') return async () => null;
        if (prop === 'findMany') return async () => [];
        if (prop === 'create') return async () => null;
        if (prop === 'update') return async () => null;
        if (prop === 'delete') return async () => null;
        if (prop === 'count') return async () => 0;

        return safePrismaModel();
      },
    },
  );

const safePrismaClient = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop.startsWith('$')) {
      return async () => undefined;
    }

    return safePrismaModel();
  },
});

export const prisma = hasDatabaseUrl
  ? (globalForPrisma.prisma ?? new PrismaClient())
  : (globalForPrisma.prisma ?? safePrismaClient);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
