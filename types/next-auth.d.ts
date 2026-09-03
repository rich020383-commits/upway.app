import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    /**
     * NOTA: `id` NO siempre es un id de base de datos. Cuando inicia sesión el
     * revisor de Meta (META_REVIEWER_EMAIL), `id` es el literal 'meta-reviewer'
     * y no existe ningún registro en la tabla User con ese valor. Endpoints que
     * consulten la DB por user.id deben manejar ese caso (o el jwt callback
     * debería omitir asignarlo para el revisor).
     */
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
