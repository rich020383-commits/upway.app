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

import { URL } from 'url';

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

/**
 * Detecta URLs corruptas donde los parametros de query se filtraron dentro
 * del hostname (ej. ...user@host-&connection_limit=5&pool_timeout=208480.h...com:12132).
 *
 * Caso verificado en produccion (Render): la DATABASE_URL quedo malformada y
 * Prisma lanzaba un error oscuro ("Can't reach database server"). Este chequeo
 * falla explicitamente con un mensaje diagnostico ANTES de que Prisma intente
 * conectar, convirtiendo un incidente en una correccion visible.
 *
 * La validacion es determinista: no usa IA, no consulta fuentes externas, y no
 * toca la base de datos. Solo analiza la forma de la URL en memoria.
 */
export function assertDatabaseUrlWellFormed(url: string): void {
  // 1. Chequeo rapido por regex: despues del '@', hasta el primer '/' o '?',
  //    el hostname (incluido el puerto) no debe contener '&' ni '='.
  //    Ese es el patron de corrupion tipico: "host-&param=value.com:port".
  const hostMatch = url.match(/^([a-z]+:\/\/)([^@/\s]+@)?([^/?\s]+)/i);
  if (!hostMatch) {
    throw new Error(
      '[database-url] DATABASE_URL tiene un formato invalido. ' +
        'Esperado: postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require&connection_limit=5&pool_timeout=20'
    );
  }
  const hostPart = hostMatch[3].toLowerCase();
  if (hostPart.includes('&') || hostPart.includes('=')) {
    throw new Error(
      `[database-url] DATABASE_URL corrupta: los parametros de query (&param=value) ` +
        `se filtraron dentro del hostname "${hostPart}".\n` +
        'Ejemplo correcto: postgresql://USER:PASS@upway-db-XXXX.h.aivencloud.com:12132/defaultdb?sslmode=require&connection_limit=5&pool_timeout=20\n' +
        'Verifica la variable en el dashboard de Render: los "&" deben estar DESPUES del DBNAME, no dentro del host.'
    );
  }

  // 2. pool_timeout absurdo (ej. 208480 = ~58h). Detecta el caso concreto
  //    de la URL de produccion que reporto con pool_timeout=208480.
  const timeoutMatch = url.match(/[?&]pool_timeout=(\d+)/i);
  if (timeoutMatch) {
    const val = Number.parseInt(timeoutMatch[1], 10);
    // 3600s = 1h. Un pool_timeout de mas de 1h es casi seguramente un error.
    if (val > 3600) {
      throw new Error(
        `[database-url] DATABASE_URL con pool_timeout=${val} (${(val / 3600).toFixed(1)}h). ` +
          'El pool_timeout se expresa en segundos y un valor de mas de 1h es casi seguramente un error. ' +
          'Revisa la URL: debe ser &pool_timeout=20, no un numero absurdo.'
      );
    }
  }

  // 3. Validacion estricta con la API URL: descarta hostnames vacios, puertos
  //    no numericos, etc. Normalizamos el protocolo a https para el parseo
  //    (Node URL no reconoce 'postgres'/'postgresql' como scheme propio).
  try {
    const parsed = new URL(url.replace(/^postgres:\/\//i, 'https://'));
    if (!parsed.hostname || parsed.hostname.length < 3) {
      throw new Error('hostname invalido');
    }
    if (parsed.port && !/^\d+$/.test(parsed.port)) {
      throw new Error(`puerto invalido: ${parsed.port}`);
    }
    if (parsed.port) {
      const portNum = Number.parseInt(parsed.port, 10);
      if (portNum < 1 || portNum > 65535) {
        throw new Error(`puerto fuera de rango: ${parsed.port}`);
      }
    }
  } catch (e) {
    throw new Error(
      `[database-url] DATABASE_URL no parseable como URL valida: ${
        e instanceof Error ? e.message : String(e)
      }. ` +
        'Revisa el formato: protocolo://USER:PASS@HOST:PORT/DBNAME?params'
    );
  }
}
