import { describe, expect, it } from 'vitest';

import { diagnosticarDatabaseUrl, resolverUrl, selftest } from './check-database-url.mjs';

// Este script es la unica via para saber QUE tiene mal la DATABASE_URL cuando
// `prisma migrate status` responde un P1013 crudo (el guardia de lib/database-url.ts
// solo corre en runtime de la app). Si su deteccion se degrada, en Render se
// vuelve a ver un error sin pista: estos casos la fijan.
describe('diagnosticarDatabaseUrl', () => {
  const H = 'upway-db-rich020383-8480.h.aivencloud.com';

  it('acepta la URL que Aiven entrega bien formada', () => {
    const r = diagnosticarDatabaseUrl(
      `postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require&connection_limit=5&pool_timeout=20`
    );
    expect(r.ok).toBe(true);
    expect(r.resumen?.protocolo).toBe('postgresql');
    expect(r.resumen?.host).toBe(H);
    expect(r.resumen?.puerto).toBe('12132');
    expect(r.resumen?.base).toBe('defaultdb');
    expect(r.resumen?.parametros).toContain('sslmode');
  });

  it('nunca expone la contrasena completa', () => {
    const r = diagnosticarDatabaseUrl(`postgresql://avnadmin:secreto123@${H}:12132/defaultdb?sslmode=require`);
    expect(String(r.resumen?.password)).toContain('*');
    expect(String(r.resumen?.password)).not.toContain('secreto');
  });

  it('detecta comillas pegadas desde el dashboard de Render', () => {
    const r = diagnosticarDatabaseUrl(`"postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require"`);
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('comillas');
  });

  it('detecta espacios sobrantes al inicio o al final', () => {
    const r = diagnosticarDatabaseUrl(`  postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require  `);
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('espacios');
  });

  it('detecta la contrasena con # sin escapar (P1013)', () => {
    const r = diagnosticarDatabaseUrl(`postgresql://avnadmin:p#ss@${H}:12132/defaultdb?sslmode=require`);
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('#');
  });

  it('detecta la query filtrada dentro del host', () => {
    const r = diagnosticarDatabaseUrl(`postgresql://avnadmin:pass@${H}-&connection_limit=5.com:12132/defaultdb`);
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('host');
  });

  it('detecta pool_timeout absurdo', () => {
    const r = diagnosticarDatabaseUrl(
      `postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require&pool_timeout=208480`
    );
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('pool_timeout');
  });

  it('detecta la falta del protocolo postgresql://', () => {
    const r = diagnosticarDatabaseUrl(`${H}:12132/defaultdb`);
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('Protocolo');
  });

  it('deja aviso, no error, cuando faltan los parametros de query', () => {
    const r = diagnosticarDatabaseUrl(`postgresql://avnadmin:pass@${H}:12132/defaultdb`);
    expect(r.ok).toBe(true);
    expect(r.avisos.join(' ')).toContain('sslmode');
  });
});

describe('resolverUrl', () => {
  it('respeta el orden de precedencia de lib/database-url.ts', () => {
    expect(resolverUrl({ AIVEN_DATABASE_URL: 'postgresql://a' })?.clave).toBe('AIVEN_DATABASE_URL');
    expect(
      resolverUrl({ DATABASE_URL: 'postgresql://b', AIVEN_DATABASE_URL: 'postgresql://a' })?.clave
    ).toBe('DATABASE_URL');
    expect(resolverUrl({})).toBeNull();
  });
});

describe('--selftest', () => {
  it('todos los casos sinteticos dan lo esperado', () => {
    const fallos = selftest().filter((r) => !r.ok);
    expect(fallos.map((f) => `${f.nombre} (ok=${f.obtenidoOk}, esperado=${f.esperadoOk})`)).toEqual([]);
  });
});